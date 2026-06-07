const router = require('express').Router();
const rewardController = require('../controllers/rewardController');
const { protect } = require('../middleware/auth');

router.get('/history', protect, rewardController.getRewardHistory);
router.get('/redemptions', protect, rewardController.getRewardRedemptions);

module.exports = router;
