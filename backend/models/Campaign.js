const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 5000 },
    budget: { type: Number, required: true, min: 0 },
    requirements: { type: String, required: true, maxlength: 3000 },
    deadline: { type: Date, required: true },
    category: {
      type: String,
      enum: ['fashion', 'tech', 'food', 'travel', 'fitness', 'beauty', 'gaming', 'education', 'lifestyle', 'other'],
      default: 'other',
    },
    status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active' },
    minFollowers: { type: Number, default: 0 },
    deliverables: [{ type: String }],
    applicantsCount: { type: Number, default: 0 },
    coverImage: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

campaignSchema.index({ brand: 1, createdAt: -1 });
campaignSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
