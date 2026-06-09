// src/models/Saree.js
const mongoose = require('mongoose');

const sareeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  category: {
    type: String,
    enum: ['bridal', 'festive', 'everyday', 'gift', 'custom'],
    required: true,
    index: true,
  },
  weaveType: {
    type: String,
    enum: ['jangla', 'tanchoi', 'shikargah', 'cutwork', 'butidar', 'kadwa', 'meenakari', 'katan', 'georgette', 'other'],
    required: true,
  },
  fabric: {
    type: String,
    enum: ['katan_silk', 'georgette', 'kora', 'organza', 'nakli_katan', 'nylon'],
    default: 'katan_silk',
  },
  
  // Media
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false },
  }],
  videoUrl: { type: String, default: null },

  // Display flags
  isFeatured: { type: Boolean, default: false, index: true },
  isActive:   { type: Boolean, default: true,  index: true },
  badge:      { type: String, default: null }, // "New", "Bestseller", etc.

  // SEO
  description: { type: String, default: '' },
  tags: [String],

  // Stats
  viewCount:    { type: Number, default: 0 },
  enquiryCount: { type: Number, default: 0 },

}, { timestamps: true });

// Auto-generate slug from name
sareeSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

sareeSchema.index({ isActive: 1, isFeatured: -1, createdAt: -1 });
sareeSchema.index({ category: 1, isActive: 1 });
sareeSchema.index({ tags: 1 });

module.exports = mongoose.model('Saree', sareeSchema);
