const mongoose = require('mongoose');
const { Schema } = mongoose;

const passwordResetSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Only a SHA-256 digest is persisted; the emailed code is never stored.
    token:      { type: String, required: true, unique: true },
    expires_at: { type: Date, required: true },
    is_used:    { type: Boolean, default: false },
    verified_at: { type: Date, default: null },
    purpose: { type: String, enum: ['forgot', 'change'], default: 'forgot' },
  },
  { timestamps: true }
);

passwordResetSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.PasswordReset || mongoose.model('PasswordReset', passwordResetSchema);
