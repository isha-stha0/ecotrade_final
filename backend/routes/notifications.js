const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, notificationController.getMyNotifications);
router.get('/stream', protect, notificationController.streamMyNotifications);
router.put('/read-all', protect, notificationController.readAllNotifications);
router.put('/:id/read', protect, notificationController.readNotification);

module.exports = router;
