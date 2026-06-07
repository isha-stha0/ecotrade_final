const router = require('express').Router();
const productController = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

router.get('/', productController.getAllProducts);
router.get('/categories', productController.getProductCategories);
router.get('/:id', productController.getProductDetails);
router.post('/', protect, adminOnly, upload.array('image_urls', 5), productController.createProduct);
router.put('/:id', protect, adminOnly, upload.array('image_urls', 5), productController.updateProduct);
router.delete('/:id', protect, adminOnly, productController.deleteProduct);

module.exports = router;
