const RewardTransaction = require('../models/RewardTransaction');
const RewardRedemption = require('../models/RewardRedemption');

exports.getRewardHistory = async (req, res) => {
  try {
    const transactions = await RewardTransaction.find({ user_id: req.user._id }).sort('-createdAt');
    res.json(transactions);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getRewardRedemptions = async (req, res) => {
  try {
    const redemptions = await RewardRedemption.find({ user_id: req.user._id })
      .populate('order_id', 'total_amount order_status')
      .sort('-createdAt');
    res.json(redemptions);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
