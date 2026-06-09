// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── POST /api/auth/login ─────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase(), isActive: true });
    if (!admin || !(await admin.comparePassword(password))) {
      logger.warn(`Failed login attempt for: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    logger.info(`Admin login: ${email}`);
    res.json({
      success: true,
      data: {
        token: generateToken(admin._id),
        admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
      },
    });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// ── POST /api/auth/setup ─────────────────────────────
// One-time setup to create first admin (disable after use)
const setup = async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      return res.status(403).json({ success: false, message: 'Setup already completed.' });
    }
    const admin = await Admin.create({
      name: 'Mullai Banaras Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'superadmin',
    });
    res.status(201).json({
      success: true,
      message: 'Admin created. Please change your password.',
      data: { email: admin.email },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/auth/me ─────────────────────────────────
const getMe = async (req, res) => {
  res.json({ success: true, data: req.admin });
};

// ── POST /api/auth/change-password ──────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin._id);
    if (!(await admin.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password incorrect.' });
    }
    admin.password = newPassword;
    await admin.save();
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { login, setup, getMe, changePassword };
