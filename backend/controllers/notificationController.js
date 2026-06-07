const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient_id: req.user._id }).sort('-createdAt');
    res.json(notifications);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.readNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient_id: req.user._id },
      { is_read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.readAllNotifications = async (req, res) => {
  try {
    await Notification.updateMany({ recipient_id: req.user._id, is_read: false }, { is_read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
