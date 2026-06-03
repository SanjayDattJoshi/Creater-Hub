const Product = require('../models/Product');

const createProduct = async (req, res) => {
  try {
    const { name, description, price, comparePrice, stock, category, tags } = req.body;
    const images = req.files ? req.files.map((f) => f.path) : [];

    const product = await Product.create({
      brand: req.user._id,
      name, description, price,
      comparePrice: comparePrice || 0,
      stock, category,
      tags: tags ? JSON.parse(tags) : [],
      images,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { category, search, brand } = req.query;

    const query = { isActive: true };
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (brand) query.brand = brand;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('brand', 'name avatar');

    const total = await Product.countDocuments(query);
    res.status(200).json({ success: true, products, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('brand', 'name avatar bio');
    if (!product || !product.isActive)
      return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.brand.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const fields = ['name', 'description', 'price', 'comparePrice', 'stock', 'category'];
    fields.forEach((f) => { if (req.body[f] !== undefined) product[f] = req.body[f]; });
    if (req.files && req.files.length > 0) product.images = req.files.map((f) => f.path);

    await product.save();
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.brand.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    product.isActive = false;
    await product.save();
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ brand: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createProduct, getProducts, getProduct, updateProduct, deleteProduct, getMyProducts };
