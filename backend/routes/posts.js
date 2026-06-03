const express = require('express');
const router = express.Router();
const {
  createPost, updatePost, getFeed, getAllPosts, getPost,
  toggleLike, deletePost, addComment, getComments,
} = require('../controllers/postController');
const { protect, optionalProtect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

router.get('/', optionalProtect, getAllPosts);
router.get('/feed', protect, getFeed);
router.post('/', protect, uploadSingle, createPost);
router.get('/:id', optionalProtect, getPost);
router.delete('/:id', protect, deletePost);
router.put('/:id', protect, updatePost);
router.post('/:id/like', protect, toggleLike);
router.get('/:id/comments', getComments);
router.post('/:id/comments', protect, addComment);

module.exports = router;