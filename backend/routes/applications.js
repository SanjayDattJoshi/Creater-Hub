const express = require('express');
const router = express.Router();
const {
  applyToCampaign, getCampaignApplications,
  getMyApplications, updateApplicationStatus,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/my', protect, authorize('creator'), getMyApplications);
router.get('/campaign/:campaignId', protect, authorize('brand'), getCampaignApplications);
router.post('/:campaignId', protect, authorize('creator'), applyToCampaign);
router.put('/:id/status', protect, authorize('brand'), updateApplicationStatus);

module.exports = router;
