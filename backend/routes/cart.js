const router = require('express').Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/', protect, cartController.getCart);
router.post('/add', protect, cartController.addItemToCart);
router.post('/remove', protect, cartController.removeItemFromCart);
router.post('/clear', protect, cartController.clearCart);

module.exports = router;
