// src/models/Analytics.js
const mongoose = require('mongoose');

// Daily analytics snapshot
const analyticsSchema = new mongoose.Schema({
  date:          { type: String, required: true, unique: true }, // YYYY-MM-DD
  pageViews:     { type: Number, default: 0 },
  uniqueVisitors:{ type: Number, default: 0 },
  enquiries:     { type: Number, default: 0 },
  whatsappClicks:{ type: Number, default: 0 },
  topPages:      [{ page: String, views: Number }],
  devices:       { mobile: Number, desktop: Number, tablet: Number },
}, { timestamps: true });

// Real-time event tracking (lightweight)
const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['page_view', 'enquiry_submit', 'whatsapp_click', 'catalogue_view', 'saree_view'],
    required: true,
    index: true,
  },
  page:      { type: String, default: '/' },
  sessionId: { type: String, index: true },
  userAgent: { type: String },
  ip:        { type: String },
  referer:   { type: String, default: null },
  metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },
}, { 
  timestamps: true,
  // Auto-expire events after 90 days to save space
  expireAfterSeconds: 7776000,
});

eventSchema.index({ createdAt: -1 });
eventSchema.index({ type: 1, createdAt: -1 });

module.exports = {
  Analytics: mongoose.model('Analytics', analyticsSchema),
  Event: mongoose.model('Event', eventSchema),
};
