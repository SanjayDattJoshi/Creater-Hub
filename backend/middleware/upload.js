const multer = require('multer');
const path = require('path');
const os = require('os');

// Store files on disk temporarily — much more reliable for large videos
// than streaming directly to Cloudinary via multer-storage-cloudinary
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `upload_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter,
});

const uploadSingle   = upload.single('media');
const uploadAvatar   = upload.single('avatar');
const uploadMultiple = upload.array('images', 10);

module.exports = { uploadSingle, uploadAvatar, uploadMultiple };