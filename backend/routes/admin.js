const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// Users
router.get('/users', protect, adminOnly, adminController.getAllUsers);
router.put('/users/:id', protect, adminOnly, adminController.updateUserProfile);
router.put('/users/:id/toggle', protect, adminOnly, adminController.toggleUserActive);
router.put('/users/:id/role', protect, adminOnly, adminController.changeUserRole);
router.delete('/users/:id', protect, adminOnly, adminController.deleteUser);

// Collector Profiles
router.get('/collectors/profiles', protect, adminOnly, adminController.getAllCollectorProfiles);
router.post('/collectors/profiles', protect, adminOnly, adminController.createCollectorProfile);
router.put('/collectors/profiles/:id', protect, adminOnly, adminController.updateCollectorProfile);

// Reports
router.post('/reports', protect, adminOnly, adminController.generateReport);
router.get('/reports', protect, adminOnly, adminController.getAllReports);

// Scheduled Reports
router.post('/scheduled-reports', protect, adminOnly, adminController.createScheduledReport);
router.get('/scheduled-reports', protect, adminOnly, adminController.getScheduledReports);
router.get('/scheduled-reports/:id', protect, adminOnly, adminController.getScheduledReportById);
router.put('/scheduled-reports/:id', protect, adminOnly, adminController.updateScheduledReport);
router.delete('/scheduled-reports/:id', protect, adminOnly, adminController.deleteScheduledReport);
router.post('/scheduled-reports/:id/execute', protect, adminOnly, adminController.executeScheduledReportNow);
router.get('/scheduler/status', protect, adminOnly, adminController.getSchedulerStatus);

// Seed
router.post('/seed', protect, adminOnly, adminController.seedProducts);

module.exports = router;
