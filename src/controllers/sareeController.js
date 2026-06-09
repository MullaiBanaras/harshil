// src/controllers/sareeController.js
const Saree = require('../models/Saree');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

// ── GET /api/sarees ─────────────────────────────────
// Public: get catalogue (cached for performance)
const getSarees = async (req, res) => {
  try {
    const { category, weaveType, featured, limit = 50, page = 1 } = req.query;

    // Build cache key from query params
    const cacheKey = `sarees_${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, fromCache: true });

    const filter = { isActive: true };
    if (category)  filter.category  = category;
    if (weaveType) filter.weaveType  = weaveType;
    if (featured === 'true') filter.isFeatured = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sarees, total] = await Promise.all([
      Saree.find(filter)
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v')
        .lean(),
      Saree.countDocuments(filter),
    ]);

    const result = { sarees, total, page: parseInt(page) };
    cache.set(cacheKey, result, 300); // Cache 5 mins

    res.json({ success: true, data: result });
  } catch (err) {
    logger.error(`Get sarees error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch catalogue.' });
  }
};

// ── GET /api/sarees/:slug ────────────────────────────
const getSaree = async (req, res) => {
  try {
    const cacheKey = `saree_${req.params.slug}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const saree = await Saree.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!saree) return res.status(404).json({ success: false, message: 'Saree not found.' });

    // Increment view count (non-blocking)
    Saree.findByIdAndUpdate(saree._id, { $inc: { viewCount: 1 } }).exec();

    cache.set(cacheKey, saree, 600);
    res.json({ success: true, data: saree });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/admin/sarees ───────────────────────────
const createSaree = async (req, res) => {
  try {
    const saree = await Saree.create(req.body);
    cache.delPattern('sarees_'); // Invalidate all saree list caches
    res.status(201).json({ success: true, data: saree });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── PUT /api/admin/sarees/:id ────────────────────────
const updateSaree = async (req, res) => {
  try {
    const saree = await Saree.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!saree) return res.status(404).json({ success: false, message: 'Saree not found.' });
    cache.delPattern('sarees_');
    cache.del(`saree_${saree.slug}`);
    res.json({ success: true, data: saree });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/admin/sarees/:id ─────────────────────
const deleteSaree = async (req, res) => {
  try {
    const saree = await Saree.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!saree) return res.status(404).json({ success: false, message: 'Saree not found.' });
    cache.delPattern('sarees_');
    res.json({ success: true, message: 'Saree removed from catalogue.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSarees, getSaree, createSaree, updateSaree, deleteSaree };
