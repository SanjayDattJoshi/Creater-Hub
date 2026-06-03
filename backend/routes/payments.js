const express = require('express');
const router  = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  createCampaignPaymentOrder,
  verifyCampaignPayment,
} = require('../controllers/paymentController');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roleCheck');

// Shop payments (any logged-in user can buy)
router.post('/create-order',           protect, createRazorpayOrder);
router.post('/verify',                 protect, verifyPayment);

// Campaign payouts (brand only)
router.post('/campaign/create-order',  protect, authorize('brand'), createCampaignPaymentOrder);
router.post('/campaign/verify',        protect, authorize('brand'), verifyCampaignPayment);

module.exports = router;