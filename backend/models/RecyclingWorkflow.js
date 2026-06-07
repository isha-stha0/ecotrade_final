const mongoose = require('mongoose');
const { Schema } = mongoose;

const recyclingWorkflowSchema = new Schema(
  {
    scrap_request_id: {
      type: Schema.Types.ObjectId,
      ref: 'ScrapRequest',
      required: true,
      unique: true,
    },
    current_stage: {
      type: String,
      enum: ['approved', 'assigned_to_collector', 'collected', 'at_center', 'sorting', 'processing', 'product_created', 'completed'],
      default: 'approved',
    },
    stage_updated_at: { type: Date, default: Date.now },
    updated_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',                                              // Admin or collector
    },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.models.RecyclingWorkflow || mongoose.model('RecyclingWorkflow', recyclingWorkflowSchema);
