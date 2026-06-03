const Razorpay    = require('razorpay');
const crypto      = require('crypto');
const Order       = require('../models/Order');
const Product     = require('../models/Product');
const Application = require('../models/Application');
const Campaign    = require('../models/Campaign');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

/* ─────────────────────────────────────────────────────────────────
   SHOP — Step 1: create Razorpay order before checkout
   POST /api/payments/create-order
   Body: { amount, currency?, receipt? }
───────────────────────────────────────────────────────────────── */
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || amount < 1)
      return res.status(400).json({ success: false, message: 'Invalid amount' });

    const options = {
      amount:  Math.round(amount * 100), // paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    const rzpOrder = await razorpay.orders.create(options);
    res.status(200).json({
      success:  true,
      orderId:  rzpOrder.id,
      amount:   rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId:    process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Payment initiation failed' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   SHOP — Step 2: verify signature + create the DB order
   POST /api/payments/verify
   Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature,
           productId, quantity, shippingAddress }
───────────────────────────────────────────────────────────────── */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      productId, quantity, shippingAddress,
    } = req.body;

    // 1. Verify Razorpay signature
    const secret   = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
    const body     = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (expected !== razorpay_signature)
      return res.status(400).json({ success: false, message: 'Payment verification failed' });

    // 2. Create / update DB order
    let order;
    if (productId) {
      // Shop purchase — create order now, marked paid
      const product = await Product.findById(productId);
      if (!product || !product.isActive)
        return res.status(404).json({ success: false, message: 'Product not found' });

      const qty = parseInt(quantity) || 1;
      if (product.stock < qty)
        return res.status(400).json({ success: false, message: 'Insufficient stock' });

      order = await Order.create({
        buyer:          req.user._id,
        product:        product._id,
        quantity:       qty,
        totalPrice:     product.price * qty,
        shippingAddress,
        paymentMethod:  'online',
        paymentStatus:  'paid',
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });

      product.stock      -= qty;
      product.ordersCount = (product.ordersCount || 0) + 1;
      await product.save();

      await order.populate('product', 'name images price');
    }

    res.status(200).json({
      success:   true,
      message:   'Payment verified successfully',
      paymentId: razorpay_payment_id,
      order,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────────
   CAMPAIGN — Step 1: brand initiates payment to accepted creator
   POST /api/payments/campaign/create-order
   Body: { applicationId }
───────────────────────────────────────────────────────────────── */
const createCampaignPaymentOrder = async (req, res) => {
  try {
    const { applicationId } = req.body;

    const application = await Application.findById(applicationId)
      .populate('campaign')
      .populate('creator', 'name');

    if (!application)
      return res.status(404).json({ success: false, message: 'Application not found' });

    if (application.campaign.brand.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    if (application.status !== 'accepted')
      return res.status(400).json({ success: false, message: 'Application must be accepted first' });

    if (application.paymentStatus === 'paid')
      return res.status(400).json({ success: false, message: 'Already paid' });

    const amount = application.proposedRate || application.campaign.budget;
    if (!amount || amount < 1)
      return res.status(400).json({ success: false, message: 'No payout amount set' });

    const rzpOrder = await razorpay.orders.create({
      amount:  Math.round(amount * 100),
      currency: 'INR',
      receipt: `camp_${applicationId}_${Date.now()}`,
    });

    res.status(200).json({
      success:       true,
      orderId:       rzpOrder.id,
      amount:        rzpOrder.amount,
      currency:      rzpOrder.currency,
      keyId:         process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      applicationId,
      creatorName:   application.creator.name,
      campaignTitle: application.campaign.title,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────────
   CAMPAIGN — Step 2: verify + mark application as paid
   POST /api/payments/campaign/verify
   Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature,
           applicationId }
───────────────────────────────────────────────────────────────── */
const verifyCampaignPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationId,
    } = req.body;

    const secret   = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
    const body     = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (expected !== razorpay_signature)
      return res.status(400).json({ success: false, message: 'Payment verification failed' });

    const application = await Application.findByIdAndUpdate(
      applicationId,
      {
        paymentStatus:     'paid',
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
      { new: true }
    );

    res.status(200).json({
      success:   true,
      message:   'Campaign payout verified',
      paymentId: razorpay_payment_id,
      application,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  createCampaignPaymentOrder,
  verifyCampaignPayment,
};