const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getAllUsers, banUser, deleteUser,
  adminGetAllPosts, adminDeletePost, adminGetAllCampaigns,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/ban', banUser);
router.delete('/users/:id', deleteUser);
router.get('/posts', adminGetAllPosts);
router.delete('/posts/:id', adminDeletePost);
router.get('/campaigns', adminGetAllCampaigns);

module.exports = router;
