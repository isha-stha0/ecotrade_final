const router = require('express').Router();
const productController = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

router.get('/', productController.getAllProducts);
router.get('/categories', productController.getProductCategories);
router.get('/:id', productController.getProductDetails);

// Upload error handler middleware
const handleUploadError = (err, req, res, next) => {
  if (err.code === 'FILE_TOO_LARGE' || err.message?.includes('fileSize')) {
    return res.status(413).json({ message: 'File size must be less than 5MB' });
  }
  if (err.message?.includes('Only PNG and JPG')) {
    return res.status(400).json({ message: 'Only PNG and JPG files are allowed' });
  }
  if (err) {
    return res.status(400).json({ message: err.message || 'File upload error' });
  }
  next();
};

router.post('/', protect, adminOnly, upload.array('image_urls', 5), handleUploadError, productController.createProduct);
router.put('/:id', protect, adminOnly, upload.array('image_urls', 5), handleUploadError, productController.updateProduct);
router.delete('/:id', protect, adminOnly, productController.deleteProduct);

module.exports = router;
