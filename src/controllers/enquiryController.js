// src/controllers/enquiryController.js
const Enquiry = require('../models/Enquiry');
const { sendEnquiryNotification, sendAutoReply } = require('../utils/emailService');
const { Event } = require('../models/Analytics');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

// ── POST /api/enquiries ──────────────────────────────
// Submit a new enquiry (public)
const submitEnquiry = async (req, res) => {
  try {
    const { name, phone, email, occasion, budget, message, source } = req.body;

    // Create enquiry in DB
    const enquiry = await Enquiry.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      occasion: occasion || 'other',
      budget: budget || 'not_specified',
      message: message?.trim() || '',
      source: source || 'website_form',
    });

    // Log analytics event (non-blocking)
    Event.create({
      type: 'enquiry_submit',
      sessionId: req.headers['x-session-id'] || 'unknown',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { occasion, budget },
    }).catch(() => {});

    // Send email notifications (non-blocking)
    sendEnquiryNotification({ name, phone, email, occasion, budget, message, source })
      .catch(err => logger.error(`Notification failed: ${err.message}`));
    sendAutoReply({ name, email })
      .catch(err => logger.error(`Auto-reply failed: ${err.message}`));

    // Invalidate stats cache
    cache.del('dashboard_stats');

    logger.info(`New enquiry from ${name} (${phone})`);

    res.status(201).json({
      success: true,
      message: 'Enquiry received! We will contact you within 24 hours.',
      data: { id: enquiry._id, refNumber: `MB${enquiry._id.toString().slice(-6).toUpperCase()}` },
    });

  } catch (err) {
    logger.error(`Enquiry submission error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not submit enquiry. Please WhatsApp us directly.' });
  }
};

// ── GET /api/admin/enquiries ─────────────────────────
// Get all enquiries for admin dashboard
const getEnquiries = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }

    const [enquiries, total] = await Promise.all([
      Enquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Enquiry.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: enquiries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    logger.error(`Get enquiries error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch enquiries.' });
  }
};

// ── PATCH /api/admin/enquiries/:id ───────────────────
// Update enquiry status or add notes
const updateEnquiry = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found.' });

    cache.del('dashboard_stats');
    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/admin/enquiries/:id ─────────────────
const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    cache.del('dashboard_stats');
    res.json({ success: true, message: 'Enquiry deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/enquiries/stats ──────────────────
const getEnquiryStats = async (req, res) => {
  try {
    const cacheKey = 'dashboard_stats';
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, fromCache: true });

    const [total, newCount, contacted, converted, todayCount] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'new' }),
      Enquiry.countDocuments({ status: 'contacted' }),
      Enquiry.countDocuments({ status: 'converted' }),
      Enquiry.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
    ]);

    // Last 7 days trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trend = await Enquiry.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
    ]);

    const stats = { total, newCount, contacted, converted, todayCount, trend };
    cache.set(cacheKey, stats, 60); // Cache for 1 minute

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { submitEnquiry, getEnquiries, updateEnquiry, deleteEnquiry, getEnquiryStats };
