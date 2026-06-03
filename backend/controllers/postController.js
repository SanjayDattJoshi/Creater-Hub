const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

// @desc    Create a post (media OR text-only)
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  const tempPath = req.file?.path;
  try {
    const { caption, hashtags, taggedProducts } = req.body;

    // ── Text-only post (no file attached) ──
    if (!req.file) {
      if (!caption || !caption.trim()) {
        return res.status(400).json({ success: false, message: 'Post must have a caption or media.' });
      }
      const post = await Post.create({
        author: req.user._id,
        mediaUrl: '',
        mediaPublicId: '',
        mediaType: 'text',
        caption: caption.trim(),
        hashtags: hashtags ? JSON.parse(hashtags) : [],
        taggedProducts: taggedProducts ? JSON.parse(taggedProducts) : [],
      });
      await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });
      await post.populate('author', 'name avatar role');
      return res.status(201).json({ success: true, post });
    }

    // ── Media post (image or video) ──
    const isVideo = req.file.mimetype?.startsWith('video/');
    console.log(`[Upload] type=${isVideo ? 'video' : 'image'} size=${req.file.size} mime=${req.file.mimetype}`);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        tempPath,
        {
          folder: 'creator_marketplace',
          resource_type: isVideo ? 'video' : 'image',
          ...(isVideo && {
            eager: [{ format: 'mp4', video_codec: 'auto' }],
            eager_async: false,
          }),
          transformation: isVideo ? [] : [{ width: 1080, crop: 'limit' }],
        },
        (err, result) => {
          if (err) { console.error('[Cloudinary error]', err); return reject(err); }
          console.log('[Cloudinary ok] url=', result.secure_url);
          resolve(result);
        }
      );
    });

    const mediaUrl = (isVideo && uploadResult.eager?.[0]?.secure_url)
      ? uploadResult.eager[0].secure_url
      : uploadResult.secure_url;

    const post = await Post.create({
      author: req.user._id,
      mediaUrl,
      mediaPublicId: uploadResult.public_id,
      mediaType: isVideo ? 'video' : 'image',
      caption: caption?.trim() || '',
      hashtags: hashtags ? JSON.parse(hashtags) : [],
      taggedProducts: taggedProducts ? JSON.parse(taggedProducts) : [],
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });
    await post.populate('author', 'name avatar role');
    res.status(201).json({ success: true, post });
  } catch (error) {
    console.error('[createPost error]', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (tempPath) fs.unlink(tempPath, () => {});
  }
};

// @desc    Get personalized feed
// @route   GET /api/posts/feed
// @access  Private
const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const following = await Follow.find({ follower: req.user._id }).select('following');
    const followingIds = following.map((f) => f.following);
    followingIds.push(req.user._id);

    const posts = await Post.find({ author: { $in: followingIds }, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar role')
      .populate('taggedProducts', 'name price images');

    const total = await Post.countDocuments({ author: { $in: followingIds }, isActive: true });

    const postsWithLiked = posts.map((post) => ({
      ...post.toObject(),
      isLiked: post.likes.map(String).includes(String(req.user._id)),
    }));

    res.status(200).json({ success: true, posts: postsWithLiked, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all posts (explore)
// @route   GET /api/posts
// @access  Public
const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { hashtag } = req.query;

    const query = { isActive: true };
    if (hashtag) query.hashtags = hashtag;

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar role')
      .populate('taggedProducts', 'name price images');

    const total = await Post.countDocuments(query);

    const currentUserId = req.user?._id ? String(req.user._id) : null;
    const postsWithLiked = posts.map((post) => ({
      ...post.toObject(),
      isLiked: currentUserId ? post.likes.map(String).includes(currentUserId) : false,
    }));

    res.status(200).json({ success: true, posts: postsWithLiked, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar bio role')
      .populate('taggedProducts', 'name price images');
    if (!post || !post.isActive) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.status(200).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Like / Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.map(String).includes(userId);

    // Use $pull/$addToSet to avoid loading the full doc through validators
    if (alreadyLiked) {
      await Post.findByIdAndUpdate(post._id, {
        $pull: { likes: req.user._id },
        $inc: { likesCount: -1 },
      });
    } else {
      await Post.findByIdAndUpdate(post._id, {
        $addToSet: { likes: req.user._id },
        $inc: { likesCount: 1 },
      });
    }

    // Re-fetch to get accurate count
    const updated = await Post.findById(post._id).select('likes likesCount');
    const likesCount = updated.likes.length; // array length is always truth

    res.status(200).json({ success: true, isLiked: !alreadyLiked, likesCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    post.isActive = false;
    await post.save();
    await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } });

    res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment
// @route   POST /api/posts/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = await Comment.create({
      post: req.params.id,
      author: req.user._id,
      content: req.body.content,
      parentComment: req.body.parentComment || null,
    });

    await Post.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } });
    await comment.populate('author', 'name avatar');

    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Public
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id, parentComment: null, isActive: true })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar');
    res.status(200).json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Update post caption/hashtags
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    // Check ownership first
    const existing = await Post.findById(req.params.id).select('author');
    if (!existing) return res.status(404).json({ success: false, message: 'Post not found' });
    if (existing.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { caption, hashtags } = req.body;
    const update = {};
    if (caption !== undefined) update.caption = caption.trim();
    if (hashtags !== undefined) {
      update.hashtags = Array.isArray(hashtags) ? hashtags : JSON.parse(hashtags);
    }

    // runValidators: false — skips enum check so old posts with mediaType:'none' don't fail
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: false }
    ).populate('author', 'name avatar role');

    res.status(200).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPost, updatePost, getFeed, getAllPosts, getPost, toggleLike, deletePost, addComment, getComments };