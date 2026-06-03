const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: false, trim: true, default: '' },
    email: {
      type: String,
      required: function () { return this.authProvider !== 'phone'; },
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, minlength: 6, select: false },
    phone: { type: String, default: null, sparse: true },
    isPhoneVerified: { type: Boolean, default: false },
    googleId: { type: String, default: null },
    authProvider: { type: String, enum: ['local', 'google', 'phone'], default: 'local' },
    role: { type: String, enum: ['creator', 'brand', 'admin'], default: 'creator' },
    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: 300, default: '' },
    category: {
      type: String,
      enum: ['fashion', 'tech', 'food', 'travel', 'fitness', 'beauty', 'gaming', 'education', 'lifestyle', 'other'],
      default: 'other',
    },
    website: { type: String, default: '' },
    socialLinks: {
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      twitter: { type: String, default: '' },
      tiktok: { type: String, default: '' },
    },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);