const Order = require('../models/Order');
const Product = require('../models/Product');
const { createNotification } = require('./notificationController');

const placeOrder = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product || !product.isActive)
      return res.status(404).json({ success: false, message: 'Product not found' });

    const { quantity, shippingAddress, paymentMethod } = req.body;
    const qty = parseInt(quantity) || 1;

    if (product.stock < qty)
      return res.status(400).json({ success: false, message: 'Insufficient stock' });

    const order = await Order.create({
      buyer: req.user._id,
      product: product._id,
      quantity: qty,
      totalPrice: product.price * qty,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
    });

    product.stock -= qty;
    product.ordersCount += 1;
    await product.save();

    await order.populate('product', 'name images price');

    // Notify brand owner
    await createNotification({
      user: product.brand,
      sender: req.user._id,
      type: 'order',
      message: `New order placed for "${product.name}"`,
      link: `/orders`,
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate({ path: 'product', populate: { path: 'brand', select: 'name avatar' } })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBrandOrders = async (req, res) => {
  try {
    const myProducts = await Product.find({ brand: req.user._id }).select('_id');
    const productIds = myProducts.map((p) => p._id);
    const orders = await Order.find({ product: { $in: productIds } })
      .populate('buyer', 'name avatar email')
      .populate('product', 'name images price')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('product');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isBrandOwner = order.product.brand.toString() === req.user._id.toString();
    if (!isBrandOwner && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const allowed = ['confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(req.body.status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    order.status = req.body.status;
    if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;
    await order.save();
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email avatar')
      .populate({ path: 'product', populate: { path: 'brand', select: 'name avatar' } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isOwner = order.buyer._id.toString() === req.user._id.toString();
    const isBrand = order.product.brand._id.toString() === req.user._id.toString();
    if (!isOwner && !isBrand && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { placeOrder, getMyOrders, getBrandOrders, updateOrderStatus, getOrderById };
