const User    = require('../models/User');
const OTP     = require('../models/OTP');
const { sendTokenResponse } = require('../utils/generateToken');
const { validationResult }  = require('express-validator');
const https = require('https');
const crypto = require('crypto');

// ── Helper: fetch Google user info ───────────────────────────────────────────
const fetchGoogleUser = (accessToken) =>
  new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.googleapis.com',
      path: '/oauth2/v3/userinfo',
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });

// ── Register ──────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, role } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const userRole = ['creator', 'brand'].includes(role) ? role : 'creator';
    const user = await User.create({ name, email, password, role: userRole });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Please provide email and password' });

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ success: false, message: `Account suspended: ${user.banReason}` });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get Me ────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ── Update Password ───────────────────────────────────────────────────────────
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Google Auth ───────────────────────────────────────────────────────────────
const googleAuth = async (req, res) => {
  const { accessToken, role } = req.body;
  if (!accessToken)
    return res.status(400).json({ success: false, message: 'Google access token required' });

  try {
    const googleUser = await fetchGoogleUser(accessToken);
    if (!googleUser?.email)
      return res.status(401).json({ success: false, message: 'Invalid Google token' });

    const { sub: googleId, email, name, picture } = googleUser;
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        if (picture && !user.avatar) user.avatar = picture;
        await user.save();
      }
      if (user.isBanned)
        return res.status(403).json({ success: false, message: `Account suspended: ${user.banReason}` });
    } else {
      const userRole = ['creator', 'brand'].includes(role) ? role : 'creator';
      user = await User.create({ name, email, googleId, avatar: picture || '', authProvider: 'google', role: userRole });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Send OTP ──────────────────────────────────────────────────────────────────
const sendOTP = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

  try {
    // Delete any existing OTPs for this phone
    await OTP.deleteMany({ phone });

    // Generate a 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.create({ phone, otp: otpCode, expiresAt });

    // ── SMS delivery ──────────────────────────────────────────────────────────
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      // DEV MODE: skip SMS, return OTP directly for easy testing
      console.log(`\n📱 DEV OTP for ${phone}: ${otpCode}\n`);
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully (dev mode)',
        devOtp: otpCode,
      });
    }

    // PRODUCTION: send via Fast2SMS (requires DLT registration)
    const cleanPhone = phone.replace(/^\+91/, '').replace(/\s/g, '');

    const smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: process.env.FAST2SMS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: otpCode,
        flash: 0,
        numbers: cleanPhone,
      }),
    });

    const smsData = await smsRes.json();

    if (!smsData.return) {
      console.error('Fast2SMS error:', smsData);
      return res.status(500).json({ success: false, message: 'Failed to send OTP via SMS.' });
    }

    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
};

// ── Verify OTP ────────────────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  const { otp, phone, name, role } = req.body;

  if (!otp || !phone)
    return res.status(400).json({ success: false, message: 'Phone and OTP are required' });

  try {
    const record = await OTP.findOne({ phone, verified: false });

    if (!record)
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new one.' });

    if (new Date() > record.expiresAt)
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

    if (record.otp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });

    // Mark as used
    record.verified = true;
    await record.save();

    // Find or create user
    let user = await User.findOne({ phone });

    if (user) {
      if (user.isBanned)
        return res.status(403).json({ success: false, message: `Account suspended: ${user.banReason}` });
      user.isPhoneVerified = true;
      await user.save();
    } else {
      const userRole = ['creator', 'brand'].includes(role) ? role : 'creator';
      user = await User.create({
        name: name || `User${phone.slice(-4)}`,
        phone,
        isPhoneVerified: true,
        authProvider: 'phone',
        role: userRole,
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'OTP verification failed. Please try again.' });
  }
};

module.exports = { register, login, getMe, logout, updatePassword, googleAuth, sendOTP, verifyOTP };