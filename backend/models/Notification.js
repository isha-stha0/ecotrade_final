const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title:   { type: String, required: true, maxlength: 255 },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['scrap_status', 'order_update', 'promotion', 'reward', 'system', 'complaint_update'],
      required: true,
    },
    reference_type: {
      type: String,
      enum: ['scrap_request', 'order', 'complaint', 'system'],
      default: null,
    },
    reference_id: {
      type: Schema.Types.ObjectId,
      default: null,                                            // ID of the linked record
    },
    is_read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient_id: 1, is_read: 1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
