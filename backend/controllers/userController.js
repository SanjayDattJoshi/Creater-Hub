const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const { createNotification } = require('./notificationController');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

// @desc    Get user profile by ID or username
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isFollowing = req.user
      ? !!(await Follow.findOne({ follower: req.user._id, following: user._id }))
      : false;

    res.status(200).json({ success: true, user: { ...user.toObject(), isFollowing } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  const tempPath = req.file?.path;
  try {
    const updates = {};
    const allowedFields = ['name', 'bio', 'category', 'website', 'socialLinks'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Upload avatar to Cloudinary if a file was provided
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          tempPath,
          {
            folder: 'creator_marketplace/avatars',
            resource_type: 'image',
            transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
          },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
      });
      updates.avatar = uploadResult.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: false,
    }).select('-password');

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('[updateProfile error]', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    // Clean up temp file
    if (tempPath) fs.unlink(tempPath, () => {});
  }
};

// @desc    Follow / Unfollow a user
// @route   POST /api/users/:id/follow
// @access  Private
const toggleFollow = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    const existingFollow = await Follow.findOne({ follower: req.user._id, following: req.params.id });

    if (existingFollow) {
      // Unfollow
      await existingFollow.deleteOne();
      await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(req.params.id, { $inc: { followersCount: -1 } });
      return res.status(200).json({ success: true, message: 'Unfollowed', isFollowing: false });
    } else {
      // Follow
      await Follow.create({ follower: req.user._id, following: req.params.id });
      await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(req.params.id, { $inc: { followersCount: 1 } });
      await createNotification({
        user: req.params.id,
        sender: req.user._id,
        type: 'follow',
        message: `${req.user.name} started following you`,
        link: `/profile/${req.user._id}`,
      });
      return res.status(200).json({ success: true, message: 'Followed', isFollowing: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get followers of a user
// @route   GET /api/users/:id/followers
// @access  Public
const getFollowers = async (req, res) => {
  try {
    const follows = await Follow.find({ following: req.params.id }).populate('follower', 'name avatar bio role');
    res.status(200).json({ success: true, followers: follows.map((f) => f.follower) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get following of a user
// @route   GET /api/users/:id/following
// @access  Public
const getFollowing = async (req, res) => {
  try {
    const follows = await Follow.find({ follower: req.params.id }).populate('following', 'name avatar bio role');
    res.status(200).json({ success: true, following: follows.map((f) => f.following) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user posts (grid view)
// @route   GET /api/users/:id/posts
// @access  Public
const getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: req.params.id, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar role');

    const total = await Post.countDocuments({ author: req.params.id, isActive: true });

    // Attach isLiked for the logged-in user (req.user set by protect middleware if token present)
    const currentUserId = req.user?._id ? String(req.user._id) : null;
    const postsWithLiked = posts.map((post) => ({
      ...post.toObject(),
      isLiked: currentUserId
        ? post.likes.map(String).includes(currentUserId)
        : false,
    }));

    res.status(200).json({ success: true, posts: postsWithLiked, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
const searchUsers = async (req, res) => {
  try {
    const { q, role, category } = req.query;
    const query = { isBanned: false };
    if (q) query.name = { $regex: q, $options: 'i' };
    if (role) query.role = role;
    if (category) query.category = category;

    const users = await User.find(query).select('name avatar bio role category followersCount').limit(20);
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUserProfile, updateProfile, toggleFollow, getFollowers, getFollowing, getUserPosts, searchUsers };