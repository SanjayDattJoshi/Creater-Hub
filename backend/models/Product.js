const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 3000 },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, default: 0 },
    images: [{ type: String }],
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: {
      type: String,
      enum: ['fashion', 'tech', 'food', 'travel', 'fitness', 'beauty', 'gaming', 'education', 'lifestyle', 'other'],
      default: 'other',
    },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    ordersCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ brand: 1 });
productSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
