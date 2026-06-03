const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // recipient
    sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },  // who triggered it
    type: {
      type: String,
      enum: ['follow', 'like', 'comment', 'message', 'application', 'order', 'campaign'],
      required: true,
    },
    message: { type: String, required: true },
    link:    { type: String, default: '' },
    isRead:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
