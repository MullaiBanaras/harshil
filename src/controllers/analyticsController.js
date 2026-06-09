// src/controllers/analyticsController.js
const { Analytics, Event } = require('../models/Analytics');
const cache = require('../utils/cache');

// ── POST /api/analytics/track ────────────────────────
// Track events from frontend (page views, whatsapp clicks etc.)
const trackEvent = async (req, res) => {
  try {
    const { type, page, sessionId, metadata } = req.body;
    
    // Non-blocking save
    Event.create({
      type,
      page: page || '/',
      sessionId: sessionId || req.headers['x-session-id'] || 'unknown',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer || null,
      metadata: metadata || {},
    }).catch(() => {});

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(200).json({ success: true }); // Always 200 — don't fail user experience
  }
};

// ── GET /api/admin/analytics ─────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const cacheKey = `analytics_${days}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, fromCache: true });

    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const [eventCounts, dailyTrend, topPages] = await Promise.all([
      // Count by event type
      Event.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      // Daily trend
      Event.aggregate([
        { $match: { createdAt: { $gte: since }, type: 'page_view' } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            views: { $sum: 1 },
            sessions: { $addToSet: '$sessionId' },
          }
        },
        { $project: { date: '$_id', views: 1, uniqueVisitors: { $size: '$sessions' } } },
        { $sort: { date: 1 } },
      ]),
      // Top pages
      Event.aggregate([
        { $match: { createdAt: { $gte: since }, type: 'page_view' } },
        { $group: { _id: '$page', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Restructure event counts
    const counts = {};
    eventCounts.forEach(e => { counts[e._id] = e.count; });

    const data = { counts, dailyTrend, topPages, period: `${days} days` };
    cache.set(cacheKey, data, 120);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { trackEvent, getAnalytics };
