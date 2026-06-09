// src/utils/emailService.js
// Sends email to you whenever someone submits an enquiry

const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool: true,          // Connection pooling for many emails
    maxConnections: 5,
    maxMessages: 100,
  });
};

// Notify YOU when a new enquiry arrives
const sendEnquiryNotification = async (enquiry) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Mullai Banaras Website" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `🆕 New Enquiry from ${enquiry.name} — Mullai Banaras`,
      html: `
        <div style="font-family:sans-serif; max-width:600px; margin:0 auto; background:#F7F3EC; padding:30px; border-radius:12px;">
          <div style="text-align:center; margin-bottom:24px;">
            <h1 style="color:#1B2A4A; font-size:24px; margin:0;">Mullai Banaras</h1>
            <p style="color:#3D4F8A; margin:4px 0 0;">New Customer Enquiry</p>
          </div>
          <div style="background:#fff; border-radius:8px; padding:20px; border-left:4px solid #B8963E;">
            <table style="width:100%; border-collapse:collapse;">
              <tr><td style="padding:8px 0; color:#666; width:140px;">Name:</td><td style="padding:8px 0; color:#1B2A4A; font-weight:600;">${enquiry.name}</td></tr>
              <tr><td style="padding:8px 0; color:#666;">Phone/WhatsApp:</td><td style="padding:8px 0; color:#1B2A4A; font-weight:600;">${enquiry.phone}</td></tr>
              <tr><td style="padding:8px 0; color:#666;">Email:</td><td style="padding:8px 0; color:#1B2A4A;">${enquiry.email || 'Not provided'}</td></tr>
              <tr><td style="padding:8px 0; color:#666;">Looking for:</td><td style="padding:8px 0; color:#1B2A4A;">${enquiry.occasion || 'Not specified'}</td></tr>
              <tr><td style="padding:8px 0; color:#666;">Budget:</td><td style="padding:8px 0; color:#1B2A4A;">${enquiry.budget || 'Not specified'}</td></tr>
              <tr><td style="padding:8px 0; color:#666;">Message:</td><td style="padding:8px 0; color:#1B2A4A;">${enquiry.message || 'No message'}</td></tr>
              <tr><td style="padding:8px 0; color:#666;">Source:</td><td style="padding:8px 0; color:#1B2A4A;">${enquiry.source}</td></tr>
              <tr><td style="padding:8px 0; color:#666;">Time:</td><td style="padding:8px 0; color:#1B2A4A;">${new Date().toLocaleString('en-IN')}</td></tr>
            </table>
          </div>
          <div style="text-align:center; margin-top:20px;">
            <a href="https://wa.me/${enquiry.phone?.replace(/\D/g, '')}" 
               style="background:#25D366; color:white; padding:12px 24px; border-radius:999px; text-decoration:none; font-weight:600; display:inline-block;">
              Reply on WhatsApp
            </a>
          </div>
        </div>
      `,
    });
    logger.info(`Enquiry notification sent for ${enquiry.name}`);
  } catch (err) {
    logger.error(`Email notification failed: ${err.message}`);
    // Don't throw — email failure shouldn't break the enquiry save
  }
};

// Auto-reply to customer
const sendAutoReply = async (enquiry) => {
  if (!enquiry.email) return;
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Mullai Banaras" <${process.env.EMAIL_USER}>`,
      to: enquiry.email,
      subject: 'Thank you for reaching out to Mullai Banaras 🪡',
      html: `
        <div style="font-family:sans-serif; max-width:600px; margin:0 auto; background:#F7F3EC; padding:30px; border-radius:12px;">
          <div style="text-align:center; margin-bottom:24px;">
            <h1 style="color:#1B2A4A; font-size:28px; margin:0; font-style:italic;">Mullai Banaras</h1>
            <p style="color:#B8963E; margin:4px 0 0; letter-spacing:2px; font-size:12px; text-transform:uppercase;">Banarasi Silk · Varanasi</p>
          </div>
          <p style="color:#1B2A4A; font-size:16px;">Dear ${enquiry.name},</p>
          <p style="color:#3D4F8A; line-height:1.7;">Thank you for your interest in Mullai Banaras. We have received your enquiry and will get back to you within <strong>24 hours</strong>.</p>
          <p style="color:#3D4F8A; line-height:1.7;">For faster response, you can also WhatsApp us directly at <strong>+91 72757 24556</strong>.</p>
          <div style="background:#fff; border-radius:8px; padding:16px; margin:20px 0; border-left:4px solid #B8963E;">
            <p style="margin:0; color:#666; font-size:13px;">Your enquiry reference: <strong style="color:#1B2A4A;">#MB${Date.now().toString().slice(-6)}</strong></p>
          </div>
          <p style="color:#3D4F8A; line-height:1.7;">Warm regards,<br/><strong style="color:#1B2A4A;">Team Mullai Banaras</strong><br/>Near Chowk Thateri Bazar, Varanasi</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error(`Auto-reply failed: ${err.message}`);
  }
};

module.exports = { sendEnquiryNotification, sendAutoReply };
