const ScrapRequest = require('../models/ScrapRequest');
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const RecyclingWorkflow = require('../models/RecyclingWorkflow');
const AuditLog = require('../models/AuditLog');
const SectorOrganization = require('../models/SectorOrganization');
const { getFileUrl } = require('../utils/cloudinary');

exports.submitScrapRequest = async (req, res) => {
  try {
    const { category, description, quantity, location, sector_type, lat, lng, preferred_pickup_time } = req.body;
    
    const photoUrls = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        photoUrls.push(getFileUrl(file, req));
      });
    }

    const pickup_location = (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;

    const scrap = await ScrapRequest.create({
      user_id: req.user._id,
      category: category || 'other',
      description: description || '',
      quantity_estimated: parseFloat(quantity || 0),
      pickup_address: location || '',
      pickup_location,
      sector_type: sector_type || 'household',
      preferred_pickup_time: preferred_pickup_time ? new Date(preferred_pickup_time) : null,
      photos: photoUrls,
      status: 'pending',
    });

    res.status(201).json(scrap);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMyScrapRequests = async (req, res) => {
  try {
    const scraps = await ScrapRequest.find({ user_id: req.user._id }).sort('-createdAt');
    res.json(scraps);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllScrapRequests = async (req, res) => {
  try {
    const { status, sector_type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (sector_type) filter.sector_type = sector_type;
    
    if (req.user.role !== 'admin' && req.user.role !== 'collector') {
      filter.user_id = req.user._id;
    }

    const scraps = await ScrapRequest.find(filter)
      .populate('user_id', 'full_name email phone')
      .populate('collector_id', 'full_name phone')
      .sort('-createdAt');

    res.json({ scraps, total: scraps.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateScrapStatus = async (req, res) => {
  try {
    const { status, adminNotes, quantity_actual, collector_id } = req.body;
    
    if (req.user.role !== 'admin' && req.user.role !== 'collector') {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    const scrap = await ScrapRequest.findById(req.params.id);
    if (!scrap) return res.status(404).json({ message: 'Scrap request not found' });

    const oldStatus = scrap.status;
    scrap.status = status;
    if (adminNotes) scrap.admin_notes = adminNotes;
    if (quantity_actual !== undefined) scrap.quantity_actual = parseFloat(quantity_actual);
    if (collector_id) scrap.collector_id = collector_id;

    if (status === 'approved') scrap.approved_at = new Date();
    if (status === 'assigned') scrap.assigned_at = new Date();
    if (status === 'collected') scrap.collected_at = new Date();
    if (status === 'completed') scrap.completed_at = new Date();

    if (status === 'approved' && scrap.points_awarded === 0) {
      const pts = scrap.calculatePoints();
      scrap.points_awarded = pts;

      const updatedUser = await User.findByIdAndUpdate(scrap.user_id, { $inc: { reward_points: pts, totalScraps: scrap.quantity_estimated } }, { new: true });
      
      await RewardTransaction.create({
        user_id: scrap.user_id,
        points: pts,
        reason: 'scrap_submission',
        reference_type: 'scrap_request',
        reference_id: scrap._id,
        balance_after: updatedUser ? updatedUser.reward_points : pts,
      });
    }

    await scrap.save();

    let workflowStage = 'approved';
    if (status === 'assigned') workflowStage = 'assigned_to_collector';
    if (status === 'collected') workflowStage = 'collected';
    if (status === 'at_center') workflowStage = 'at_center';
    if (status === 'processed') workflowStage = 'processing';
    if (status === 'completed') workflowStage = 'completed';

    await RecyclingWorkflow.findOneAndUpdate(
      { scrap_request_id: scrap._id },
      { current_stage: workflowStage, stage_updated_at: new Date(), updated_by: req.user._id },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      actor_id: req.user._id,
      action: 'update_scrap_status',
      target_table: 'ScrapRequest',
      target_id: scrap._id,
      old_value: { status: oldStatus },
      new_value: { status: status },
      ip_address: req.ip,
    });

    res.json(scrap);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.registerSectorOrganization = async (req, res) => {
  try {
    const { org_name, org_type, contact_person, phone, address, lat, lng } = req.body;
    
    const location = (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;

    const org = await SectorOrganization.create({
      user_id: req.user._id,
      org_name,
      org_type,
      contact_person,
      phone,
      address,
      location,
    });

    res.status(201).json(org);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteScrapRequest = async (req, res) => {
  try {
    const scrap = await ScrapRequest.findById(req.params.id);
    if (!scrap) return res.status(404).json({ message: 'Not found' });
    if (scrap.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    
    await scrap.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
