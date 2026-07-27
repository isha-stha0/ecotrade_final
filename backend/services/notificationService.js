const { EventEmitter } = require('events');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Notifications are persisted first, then broadcast to currently connected clients.
// Persisting them means no event is lost when a user, collector, or admin is offline.
const events = new EventEmitter();
events.setMaxListeners(0);

async function createNotification({ recipientId, title, message, type, referenceType, referenceId }) {
  if (!recipientId) return null;
  const notification = await Notification.create({
    recipient_id: recipientId,
    title,
    message,
    type,
    reference_type: referenceType || null,
    reference_id: referenceId || null,
  });
  events.emit(`notification:${recipientId}`, notification.toJSON());
  return notification;
}

async function notifyRoles(roles, payload) {
  const users = await User.find({ role: { $in: roles }, is_active: true }).select('_id');
  return Promise.all(users.map((user) => createNotification({ ...payload, recipientId: user._id })));
}

function subscribe(userId, listener) {
  const event = `notification:${userId}`;
  events.on(event, listener);
  return () => events.off(event, listener);
}

module.exports = { createNotification, notifyRoles, subscribe };
