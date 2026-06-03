const Application = require('../models/Application');
const Campaign = require('../models/Campaign');

const applyToCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign || campaign.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Campaign not found or not active' });
    }
    const existing = await Application.findOne({ campaign: req.params.campaignId, creator: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'Already applied' });

    const application = await Application.create({
      campaign: req.params.campaignId,
      creator: req.user._id,
      message: req.body.message,
      proposedRate: req.body.proposedRate || 0,
    });
    await Campaign.findByIdAndUpdate(req.params.campaignId, { $inc: { applicantsCount: 1 } });
    await application.populate('creator', 'name avatar bio category followersCount');
    res.status(201).json({ success: true, application });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Already applied' });
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCampaignApplications = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    if (campaign.brand.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const applications = await Application.find({ campaign: req.params.campaignId })
      .populate('creator', 'name avatar bio category followersCount socialLinks')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ creator: req.user._id })
      .populate({ path: 'campaign', populate: { path: 'brand', select: 'name avatar' } })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('campaign');
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    if (application.campaign.brand.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const { status, brandNote } = req.body;
    if (!['accepted', 'rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    application.status = status;
    if (brandNote) application.brandNote = brandNote;
    await application.save();
    res.status(200).json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { applyToCampaign, getCampaignApplications, getMyApplications, updateApplicationStatus };
