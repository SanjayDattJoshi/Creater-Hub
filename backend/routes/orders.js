const express = require('express');
const router = express.Router();
const {
  placeOrder, getMyOrders, getBrandOrders,
  updateOrderStatus, getOrderById,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/my', protect, getMyOrders);
router.get('/brand', protect, authorize('brand'), getBrandOrders);
router.post('/:productId', protect, placeOrder);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;
