const Campaign = require('../models/Campaign');

// @desc    Create campaign (brand only)
// @route   POST /api/campaigns
// @access  Private (brand)
const createCampaign = async (req, res) => {
  try {
    const { title, description, budget, requirements, deadline, category, minFollowers, deliverables } = req.body;

    const campaign = await Campaign.create({
      brand: req.user._id,
      title,
      description,
      budget,
      requirements,
      deadline,
      category,
      minFollowers: minFollowers || 0,
      deliverables: deliverables ? JSON.parse(deliverables) : [],
      coverImage: req.file ? req.file.path : '',
    });

    await campaign.populate('brand', 'name avatar');
    res.status(201).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Public
const getCampaigns = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, status, search } = req.query;

    const query = { isActive: true };
    if (category) query.category = category;
    if (status) query.status = status;
    else query.status = 'active';
    if (search) query.title = { $regex: search, $options: 'i' };

    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('brand', 'name avatar');

    const total = await Campaign.countDocuments(query);
    res.status(200).json({ success: true, campaigns, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single campaign
// @route   GET /api/campaigns/:id
// @access  Public
const getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('brand', 'name avatar bio');
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.status(200).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private (brand owner)
const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    if (campaign.brand.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const allowedUpdates = ['title', 'description', 'budget', 'requirements', 'deadline', 'category', 'status', 'minFollowers'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) campaign[field] = req.body[field];
    });

    if (req.file) campaign.coverImage = req.file.path;
    await campaign.save();

    res.status(200).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private (brand owner or admin)
const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    if (campaign.brand.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    campaign.isActive = false;
    await campaign.save();
    res.status(200).json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get brand's own campaigns
// @route   GET /api/campaigns/my
// @access  Private (brand)
const getMyCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ brand: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createCampaign, getCampaigns, getCampaign, updateCampaign, deleteCampaign, getMyCampaigns };
