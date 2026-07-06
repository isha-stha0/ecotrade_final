const ScrapRequest = require('../models/ScrapRequest');
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const RecyclingWorkflow = require('../models/RecyclingWorkflow');
const AuditLog = require('../models/AuditLog');
const SectorOrganization = require('../models/SectorOrganization');
const { getFileUrl } = require('../utils/cloudinary');
const {
  getRouteInfo,
  formatScrapLocationData,
  getNearbysScraps,
  createMapMarker,
} = require('../services/locationService');

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
    if (req.user.role === 'collector' && ['assigned', 'collected', 'completed'].includes(status)) {
      scrap.collector_id = req.user._id;
    }

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

// Location-based Services for Map Integration

exports.getScrapLocationData = async (req, res) => {
  try {
    const { id } = req.params;
    const scrap = await ScrapRequest.findById(id)
      .populate('user_id', 'full_name phone email')
      .populate('collector_id', 'full_name phone');

    if (!scrap) {
      return res.status(404).json({ message: 'Scrap request not found' });
    }

    // Check authorization - user can see their own, collector their assigned, admin all
    if (req.user.role !== 'admin' && 
        scrap.user_id._id.toString() !== req.user._id.toString() &&
        (!scrap.collector_id || scrap.collector_id._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this location' });
    }

    // Format location data
    const locationData = formatScrapLocationData(scrap, scrap.collector_id ? scrap.collector_id : null);

    res.json({
      scrap_id: scrap._id,
      user: scrap.user_id,
      collector: scrap.collector_id || null,
      location: locationData,
      status: scrap.status,
      category: scrap.category,
      quantity: scrap.quantity_estimated,
      photos: scrap.photos,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getScrapMapMarkers = async (req, res) => {
  try {
    const { status, radius = 5 } = req.query;
    const filter = { status: status || 'assigned' };

    // Admin sees all, collectors see nearby, users see their own
    if (req.user.role === 'collector') {
      filter.collector_id = req.user._id;
    } else if (req.user.role !== 'admin') {
      filter.user_id = req.user._id;
    }

    const scraps = await ScrapRequest.find(filter)
      .populate('user_id', 'full_name phone')
      .populate('collector_id', 'full_name phone');

    const markers = scraps
      .map((scrap) => createMapMarker(scrap, 'scrap'))
      .filter((marker) => marker !== null);

    res.json({
      total: markers.length,
      markers,
      center: markers.length > 0 ? {
        lat: markers[0].lat,
        lng: markers[0].lng,
      } : { lat: 27.7172, lng: 85.3240 }, // Default to Kathmandu
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getNearbyScrapRequests = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const collectorLocation = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    };

    // Get pending/approved scraps
    const scraps = await ScrapRequest.find({
      status: { $in: ['pending', 'approved'] },
      pickup_location: { $exists: true },
    })
      .populate('user_id', 'full_name phone email')
      .limit(20);

    const nearbyScraps = getNearbysScraps(collectorLocation, scraps, parseFloat(radius));

    res.json({
      total: nearbyScraps.length,
      radius_km: radius,
      scraps: nearbyScraps.map((scrap) => ({
        id: scrap._id,
        category: scrap.category,
        quantity: scrap.quantity_estimated,
        location: scrap.pickup_address,
        distance_km: scrap.distance_km,
        travel_time_minutes: scrap.travel_time_minutes,
        user: scrap.user_id,
        photos: scrap.photos,
        coordinates: scrap.pickup_location,
      })),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getCollectorRouteInfo = async (req, res) => {
  try {
    const { scrapId } = req.params;
    const { collectorLat, collectorLng } = req.query;

    if (!collectorLat || !collectorLng) {
      return res.status(400).json({ message: 'Collector location is required' });
    }

    const scrap = await ScrapRequest.findById(scrapId)
      .populate('collector_id', 'full_name phone');

    if (!scrap) {
      return res.status(404).json({ message: 'Scrap request not found' });
    }

    if (!scrap.pickup_location) {
      return res.status(400).json({ message: 'Scrap location not available' });
    }

    const collectorLocation = {
      lat: parseFloat(collectorLat),
      lng: parseFloat(collectorLng),
    };

    const route = getRouteInfo(collectorLocation, scrap.pickup_location);

    res.json({
      scrap_id: scrap._id,
      collector: scrap.collector_id,
      collector_location: collectorLocation,
      scrap_location: scrap.pickup_location,
      scrap_address: scrap.pickup_address,
      route: route,
      status: scrap.status,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateCollectorLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Update user's current location (in-memory or Redis for real-time tracking)
    // For now, we'll just return confirmation
    // In production, this would be stored in Redis or a real-time database

    res.json({
      success: true,
      message: 'Location updated',
      current_location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      },
      timestamp: new Date(),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
