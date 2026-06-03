const User = require('../models/User');
const Post = require('../models/Post');
const Campaign = require('../models/Campaign');
const Order = require('../models/Order');
const Application = require('../models/Application');

const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalPosts, totalCampaigns, totalOrders, newUsersThisWeek] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments({ isActive: true }),
      Campaign.countDocuments({ isActive: true }),
      Order.countDocuments(),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role avatar createdAt');
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5)
      .populate('buyer', 'name avatar')
      .populate('product', 'name price');

    res.status(200).json({
      success: true,
      stats: { totalUsers, totalPosts, totalCampaigns, totalOrders, newUsersThisWeek },
      usersByRole,
      recentUsers,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, role } = req.query;

    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (role) query.role = role;

    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await User.countDocuments(query);
    res.status(200).json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot ban an admin' });

    user.isBanned = !user.isBanned;
    user.banReason = user.isBanned ? (req.body.reason || 'Violated terms of service') : '';
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBanned ? 'User banned' : 'User unbanned',
      isBanned: user.isBanned,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete admin' });
    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted permanently' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const adminGetAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar');
    const total = await Post.countDocuments();
    res.status(200).json({ success: true, posts, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const adminDeletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.isActive = false;
    await post.save();
    res.status(200).json({ success: true, message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const adminGetAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .populate('brand', 'name avatar');
    res.status(200).json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats, getAllUsers, banUser, deleteUser,
  adminGetAllPosts, adminDeletePost, adminGetAllCampaigns,
};
