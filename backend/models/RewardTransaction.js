const mongoose = require('mongoose');
const { Schema } = mongoose;

const rewardTransactionSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    points: { type: Number, required: true },                   // + earned, − redeemed/expired
    reason: { type: String, required: true, maxlength: 255 },   // e.g., 'scrap_submission'
    reference_type: {
      type: String,
      enum: ['scrap_request', 'order', 'manual', 'referral', 'expiry'],
      required: true,
    },
    reference_id: {
      type: Schema.Types.ObjectId,
      default: null,                                            // ID of scrap_request or order
    },
    balance_after: { type: Number },                            // Points total after transaction
  },
  { timestamps: true }
);

rewardTransactionSchema.index({ user_id: 1 });

module.exports = mongoose.models.RewardTransaction || mongoose.model('RewardTransaction', rewardTransactionSchema);
