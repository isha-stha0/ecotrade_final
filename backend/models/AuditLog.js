const mongoose = require('mongoose');
const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    actor_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action:       { type: String, required: true, maxlength: 100 },
    target_table: { type: String, maxlength: 50 },
    target_id: {
      type: Schema.Types.ObjectId,
    },
    old_value: { type: Schema.Types.Mixed, default: null },
    new_value: { type: Schema.Types.Mixed, default: null },
    ip_address: { type: String, maxlength: 45 },
  },
  { timestamps: true }
);

auditLogSchema.index({ actor_id: 1 });
auditLogSchema.index({ target_table: 1, target_id: 1 });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
