const router = require('express').Router();
const feedbackController = require('../controllers/feedbackController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, feedbackController.leaveFeedback);
router.get('/', protect, adminOnly, feedbackController.getAllFeedbacks);
router.put('/:id/respond', protect, adminOnly, feedbackController.respondToFeedback);

module.exports = router;
