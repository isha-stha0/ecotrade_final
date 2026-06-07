const mongoose = require('mongoose');
const { Schema } = mongoose;

const collectorAssignmentSchema = new Schema(
  {
    scrap_request_id: {
      type: Schema.Types.ObjectId,
      ref: 'ScrapRequest',
      required: true,
    },
    collector_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assigned_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',                                              // Admin who made the assignment
    },
    accepted_at:    { type: Date, default: null },              // When collector accepted
    completed_at:   { type: Date, default: null },
    status: {
      type: String,
      enum: ['assigned', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'assigned',
    },
    collector_notes: { type: String },
  },
  { timestamps: true }                                          // createdAt = assigned_at
);

collectorAssignmentSchema.index({ scrap_request_id: 1 });
collectorAssignmentSchema.index({ collector_id: 1 });

module.exports = mongoose.models.CollectorAssignment || mongoose.model('CollectorAssignment', collectorAssignmentSchema);
