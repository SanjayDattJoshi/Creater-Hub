const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    buyer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity:   { type: Number, required: true, min: 1, default: 1 },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    shippingAddress: {
      fullName:    { type: String, required: true },
      addressLine1:{ type: String, required: true },
      addressLine2:{ type: String, default: '' },
      city:        { type: String, required: true },
      state:       { type: String, required: true },
      postalCode:  { type: String, required: true },
      country:     { type: String, required: true },
      phone:       { type: String, required: true },
    },
    paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    trackingNumber: { type: String, default: '' },
    notes:          { type: String, default: '' },

    // Razorpay references
    razorpayOrderId:   { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ product: 1 });

module.exports = mongoose.model('Order', orderSchema);