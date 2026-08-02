const router = require('express').Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

router.post('/register', upload.single('profile_photo'), authController.register);
router.post('/login', authController.login);
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);
router.put('/profile/photo', protect, upload.single('profile_photo'), authController.uploadProfilePhoto);
router.put('/change-password', protect, authController.changePassword);
router.post('/change-password/request-otp', protect, authController.requestChangePasswordOtp);
router.post('/change-password/verify-otp', protect, authController.verifyChangePasswordOtp);
router.put('/change-password/with-otp', protect, authController.changePasswordWithOtp);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
