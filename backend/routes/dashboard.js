const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/user', protect, dashboardController.getUserDashboard);
router.get('/admin', protect, adminOnly, dashboardController.getAdminDashboard);

module.exports = router;
