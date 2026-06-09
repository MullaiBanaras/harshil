// src/routes/index.js
const express = require('express');
const router  = express.Router();

const { protect, superAdminOnly } = require('../middleware/auth');
const { enquiryLimiter, authLimiter } = require('../middleware/rateLimiter');
const { body, validationResult } = require('express-validator');

const authCtrl     = require('../controllers/authController');
const enquiryCtrl  = require('../controllers/enquiryController');
const sareeCtrl    = require('../controllers/sareeController');
const analyticsCtrl= require('../controllers/analyticsController');

// ── Helper: validate & return errors ────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// ════════════════════════════════════════════════════
// PUBLIC ROUTES
// ════════════════════════════════════════════════════

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'Mullai Banaras API is running 🪡',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's',
  });
});

// ── Auth ─────────────────────────────────────────────
router.get('/auth/setup',  authCtrl.setup); // GET so it works directly in browser
router.post('/auth/setup', authCtrl.setup); // POST also works
router.post('/auth/login', authLimiter, authCtrl.login);

// ── Enquiries (public submit) ────────────────────────
router.post('/enquiries',
  enquiryLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('phone').trim().notEmpty().withMessage('Phone is required').matches(/^[+\d\s-]{7,20}$/),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Invalid email'),
    body('message').optional().isLength({ max: 1000 }),
  ],
  validate,
  enquiryCtrl.submitEnquiry
);

// ── Catalogue (public) ───────────────────────────────
router.get('/sarees',       sareeCtrl.getSarees);
router.get('/sarees/:slug', sareeCtrl.getSaree);

// ── Analytics tracking (public — called from frontend) ──
router.post('/analytics/track', analyticsCtrl.trackEvent);


// ════════════════════════════════════════════════════
// ADMIN PROTECTED ROUTES
// ════════════════════════════════════════════════════
router.use('/admin', protect); // All /admin routes require JWT

// Auth
router.get('/auth/me',              protect, authCtrl.getMe);
router.post('/auth/change-password', protect, authCtrl.changePassword);

// Enquiries management
router.get('/admin/enquiries',       enquiryCtrl.getEnquiries);
router.get('/admin/enquiries/stats', enquiryCtrl.getEnquiryStats);
router.patch('/admin/enquiries/:id', enquiryCtrl.updateEnquiry);
router.delete('/admin/enquiries/:id', superAdminOnly, enquiryCtrl.deleteEnquiry);

// Catalogue management
router.get('/admin/sarees',      sareeCtrl.getSarees);
router.post('/admin/sarees',     sareeCtrl.createSaree);
router.put('/admin/sarees/:id',  sareeCtrl.updateSaree);
router.delete('/admin/sarees/:id', sareeCtrl.deleteSaree);

// Analytics dashboard
router.get('/admin/analytics', analyticsCtrl.getAnalytics);

module.exports = router;
