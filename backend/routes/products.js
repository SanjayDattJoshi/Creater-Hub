const express = require('express');
const router = express.Router();
const {
  createProduct, getProducts, getProduct,
  updateProduct, deleteProduct, getMyProducts,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { uploadMultiple } = require('../middleware/upload');

router.get('/', getProducts);
router.get('/my', protect, authorize('brand'), getMyProducts);
router.post('/', protect, authorize('brand'), uploadMultiple, createProduct);
router.get('/:id', getProduct);
router.put('/:id', protect, authorize('brand'), uploadMultiple, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
