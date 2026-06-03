const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    campaign:    { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    creator:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    message:     { type: String, required: true, maxlength: 2000 },
    proposedRate:{ type: Number, default: 0 },
    status:      { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    brandNote:   { type: String, default: '' },

    // Payment tracking
    paymentStatus:     { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    razorpayOrderId:   { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
  },
  { timestamps: true }
);

// A creator can only apply once per campaign
applicationSchema.index({ campaign: 1, creator: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);