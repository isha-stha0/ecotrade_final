const router = require('express').Router();
const complaintController = require('../controllers/complaintController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, complaintController.lodgeComplaint);
router.get('/my', protect, complaintController.getMyComplaints);
router.get('/', protect, adminOnly, complaintController.getAllComplaints);
router.put('/:id/resolve', protect, adminOnly, complaintController.resolveComplaint);

module.exports = router;
