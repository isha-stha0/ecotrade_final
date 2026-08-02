const router = require('express').Router();
const scrapController = require('../controllers/scrapController');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

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

// Scrap submission and management
router.get('/categories', protect, scrapController.getScrapCategories);
router.post('/', protect, upload.array('photos', 5), handleUploadError, scrapController.submitScrapRequest);
router.get('/my', protect, scrapController.getMyScrapRequests);
router.get('/', protect, scrapController.getAllScrapRequests);
router.put('/:id/status', protect, scrapController.updateScrapStatus);
router.post('/:id/claim', protect, scrapController.claimScrapRequest);
router.post('/:id/decline', protect, scrapController.declineScrapRequest);
router.post('/sector-organization', protect, scrapController.registerSectorOrganization);
router.delete('/:id', protect, scrapController.deleteScrapRequest);

// Location and Map Integration Routes
router.get('/:id/location', protect, scrapController.getScrapLocationData);
router.get('/map/markers', protect, scrapController.getScrapMapMarkers);
router.get('/map/nearby', protect, scrapController.getNearbyScrapRequests);
router.get('/:scrapId/route', protect, scrapController.getCollectorRouteInfo);
router.post('/collector/location', protect, scrapController.updateCollectorLocation);

module.exports = router;
