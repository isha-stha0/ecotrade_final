const Notification = require('../models/Notification');
const { subscribe } = require('../services/notificationService');

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

// Server-Sent Events keeps the foreground app updated without a polling delay.
// Authentication is the normal Bearer token middleware used by every other route.
exports.streamMyNotifications = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  res.write('event: connected\ndata: {}\n\n');
  const unsubscribe = subscribe(req.user._id.toString(), (notification) => {
    res.write(`event: notification\ndata: ${JSON.stringify(notification)}\n\n`);
  });
  const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 25000);
  req.on('close', () => { clearInterval(heartbeat); unsubscribe(); });
};
