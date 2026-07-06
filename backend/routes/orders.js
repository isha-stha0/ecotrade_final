const router = require('express').Router();
const orderController = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, orderController.placeOrder);
router.get('/my', protect, orderController.getMyOrders);
router.get('/', protect, adminOnly, orderController.getAllOrders);
router.put('/:id/status', protect, adminOnly, orderController.updateOrderStatus);

// eSewa Payment Routes
router.post('/esewa/initiate', protect, orderController.initiateEsewaPayment);
router.post('/esewa/verify', protect, orderController.verifyEsewaPayment);
router.post('/esewa/failure', protect, orderController.handleEsewaFailure);

module.exports = router;
