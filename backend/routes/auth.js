const express = require('express');
const router  = express.Router();
const {
  register, login, getMe, logout,
  updatePassword, googleAuth, sendOTP, verifyOTP,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register',         register);
router.post('/login',            login);
router.post('/google',           googleAuth);
router.post('/send-otp',         sendOTP);
router.post('/verify-otp',       verifyOTP);
router.get('/me',                protect, getMe);
router.post('/logout',           protect, logout);
router.put('/update-password',   protect, updatePassword);

module.exports = router;
