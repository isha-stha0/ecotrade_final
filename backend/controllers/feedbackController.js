const Feedback = require('../models/Feedback');

exports.leaveFeedback = async (req, res) => {
  try {
    const { rating, feedback_type, comment } = req.body;
    if (!rating) return res.status(400).json({ message: 'Rating is required' });

    const feedback = await Feedback.create({
      user_id: req.user._id,
      rating: parseInt(rating),
      feedback_type: feedback_type || 'general',
      comment: comment || ''
    });
    res.status(201).json(feedback);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate('user_id', 'full_name email').sort('-createdAt');
    res.json(feedbacks);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.respondToFeedback = async (req, res) => {
  try {
    const { response } = req.body;
    if (!response) return res.status(400).json({ message: 'Response is required' });

    const feedback = await Feedback.findByIdAndUpdate(req.params.id, {
      admin_response: response,
      response_status: 'replied',
      responded_at: new Date()
    }, { new: true });
    
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
