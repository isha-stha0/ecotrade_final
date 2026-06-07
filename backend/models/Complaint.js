const mongoose = require('mongoose');
const { Schema } = mongoose;

const complaintSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scrap_request_id: {
      type: Schema.Types.ObjectId,
      ref: 'ScrapRequest',
      default: null,
    },
    order_id: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    issue_type: {
      type: String,
      enum: ['collector_no_show', 'wrong_weight', 'payment_issue', 'product_defect', 'late_delivery', 'app_bug', 'other'],
      required: true,
    },
    description:    { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'resolved', 'dismissed'],
      default: 'pending',
    },
    admin_response: { type: String },
    resolved_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolved_at: { type: Date, default: null },
  },
  { timestamps: true }
);

complaintSchema.index({ user_id: 1 });
complaintSchema.index({ status: 1 });

module.exports = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
