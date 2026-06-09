// src/models/Enquiry.js
const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  // Customer details
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name too long'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[+\d\s-]{7,20}$/, 'Invalid phone number'],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    default: null,
  },

  // Saree preferences
  occasion: {
    type: String,
    enum: ['bridal', 'festive', 'gift', 'everyday', 'bulk', 'custom', 'other'],
    default: 'other',
  },
  budget: {
    type: String,
    enum: ['10-20k', '20-40k', '40-70k', '70k+', 'not_specified'],
    default: 'not_specified',
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message too long'],
    default: '',
  },

  // Tracking
  status: {
    type: String,
    enum: ['new', 'contacted', 'converted', 'closed'],
    default: 'new',
    index: true,
  },
  source: {
    type: String,
    enum: ['website_form', 'whatsapp', 'direct', 'referral'],
    default: 'website_form',
  },
  adminNotes: {
    type: String,
    default: '',
  },
  
  // Auto timestamps
}, {
  timestamps: true,  // createdAt, updatedAt
});

// Indexes for fast queries
enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ phone: 1 });

// Virtual: days since enquiry
enquirySchema.virtual('daysSinceEnquiry').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Enquiry', enquirySchema);
