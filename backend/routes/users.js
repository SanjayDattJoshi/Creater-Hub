const express = require('express');
const router = express.Router();
const {
  getUserProfile, updateProfile, toggleFollow,
  getFollowers, getFollowing, getUserPosts, searchUsers,
} = require('../controllers/userController');
const { protect, optionalProtect } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

router.get('/search', searchUsers);
router.get('/:id', getUserProfile);
router.put('/profile', protect, uploadAvatar, updateProfile);
router.post('/:id/follow', protect, toggleFollow);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
// optionalProtect: attaches req.user if logged in so isLiked is correct, but doesn't block guests
router.get('/:id/posts', optionalProtect, getUserPosts);

module.exports = router;