const express = require('express');
const router = express.Router();
const {
  createCampaign, getCampaigns, getCampaign,
  updateCampaign, deleteCampaign, getMyCampaigns,
} = require('../controllers/campaignController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { uploadSingle } = require('../middleware/upload');

router.get('/', getCampaigns);
router.get('/my', protect, authorize('brand'), getMyCampaigns);
router.post('/', protect, authorize('brand'), uploadSingle, createCampaign);
router.get('/:id', getCampaign);
router.put('/:id', protect, authorize('brand'), uploadSingle, updateCampaign);
router.delete('/:id', protect, deleteCampaign);

module.exports = router;
