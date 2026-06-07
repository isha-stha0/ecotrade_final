const router = require('express').Router();
const scrapController = require('../controllers/scrapController');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

router.post('/', protect, upload.array('photos', 5), scrapController.submitScrapRequest);
router.get('/my', protect, scrapController.getMyScrapRequests);
router.get('/', protect, scrapController.getAllScrapRequests);
router.put('/:id/status', protect, scrapController.updateScrapStatus);
router.post('/sector-organization', protect, scrapController.registerSectorOrganization);
router.delete('/:id', protect, scrapController.deleteScrapRequest);

module.exports = router;
