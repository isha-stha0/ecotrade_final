const mongoose = require('mongoose');
const { Schema } = mongoose;

const rewardRedemptionSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order_id: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    points_used:     { type: Number, required: true, min: 1 },
    discount_amount: { type: Number, required: true, min: 0 }, // Rupee value of points redeemed
  },
  { timestamps: true }                                          // createdAt = redeemed_at
);

module.exports = mongoose.models.RewardRedemption || mongoose.model('RewardRedemption', rewardRedemptionSchema);
