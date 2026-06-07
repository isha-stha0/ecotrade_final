const Complaint = require('../models/Complaint');

exports.lodgeComplaint = async (req, res) => {
  try {
    const { scrap_request_id, order_id, issue_type, description } = req.body;
    if (!issue_type || !description) {
      return res.status(400).json({ message: 'Issue type and description are required' });
    }

    const complaint = await Complaint.create({
      user_id: req.user._id,
      scrap_request_id: scrap_request_id || null,
      order_id: order_id || null,
      issue_type,
      description
    });
    res.status(201).json(complaint);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ user_id: req.user._id })
      .populate('scrap_request_id')
      .populate('order_id')
      .sort('-createdAt');
    res.json(complaints);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllComplaints = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const complaints = await Complaint.find(filter)
      .populate('user_id', 'full_name email')
      .populate('resolved_by', 'full_name')
      .sort('-createdAt');
    res.json(complaints);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.resolveComplaint = async (req, res) => {
  try {
    const { response, status } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, {
      admin_response: response || '',
      status: status || 'resolved',
      resolved_by: req.user._id,
      resolved_at: new Date()
    }, { new: true });

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
