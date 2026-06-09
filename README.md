# 🪡 Mullai Banaras — Backend

Complete Node.js/Express backend with MongoDB for the Mullai Banaras saree business website.

---

## ✅ What This Backend Does

| Feature | Details |
|---|---|
| **Enquiry Management** | Save all enquiries from website form |
| **Email Notifications** | You get email when customer enquires |
| **Auto-Reply** | Customer gets instant confirmation email |
| **Admin Dashboard** | Beautiful UI to manage enquiries & catalogue |
| **Catalogue API** | Manage your saree listings from dashboard |
| **Analytics** | Track page views, WhatsApp clicks, enquiries |
| **Rate Limiting** | Prevents spam & server abuse |
| **Caching** | Fast response under high traffic (Node-Cache) |
| **Security** | Helmet, JWT auth, CORS, input validation |

---

## 🚀 Setup in 5 Steps

### Step 1 — Install Node.js
Download from: https://nodejs.org (version 18+)

### Step 2 — Get Free MongoDB Database
1. Go to https://mongodb.com/atlas
2. Create free account → Create free cluster
3. Click "Connect" → Copy your connection string

### Step 3 — Configure Environment
```bash
cp .env.example .env
```
Edit `.env` and fill in:
- `MONGODB_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string
- `EMAIL_USER` — your Gmail address
- `EMAIL_PASS` — Gmail App Password (Google Account → Security → App Passwords)
- `ADMIN_EMAIL` — your admin email
- `ADMIN_PASSWORD` — your admin password

### Step 4 — Install & Run
```bash
npm install
npm start
```
Server starts at: http://localhost:5000

### Step 5 — Create Admin Account (first time only)
Open browser: http://localhost:5000/api/auth/setup

---

## 📋 API Endpoints

### Public (no login needed)
```
GET  /api/health              — Check if server is running
POST /api/enquiries           — Submit enquiry from website
GET  /api/sarees              — Get catalogue
POST /api/analytics/track     — Track visitor events
```

### Admin (needs login token)
```
POST /api/auth/login          — Admin login
GET  /api/admin/enquiries     — View all enquiries
GET  /api/admin/enquiries/stats — Dashboard stats
PATCH /api/admin/enquiries/:id — Update status/notes
GET  /api/admin/analytics     — Analytics data
POST /api/admin/sarees        — Add saree to catalogue
```

---

## 🖥️ Admin Dashboard
Open: http://localhost:5000/admin.html
- Login with your admin email/password
- View all enquiries from customers
- Click WhatsApp button to reply directly
- Mark enquiries as: New → Contacted → Converted
- Add/manage sarees in catalogue
- View analytics charts

---

## 🌐 Connect to Your Website

Add this to your `mullai_banaras_website.html` before `</body>`:

```html
<script>
// Track page view
fetch('https://your-backend-url.com/api/analytics/track', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ type: 'page_view', page: '/' })
});

// Track WhatsApp button clicks
document.querySelectorAll('a[href*="wa.me"]').forEach(btn => {
  btn.addEventListener('click', () => {
    fetch('https://your-backend-url.com/api/analytics/track', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ type: 'whatsapp_click' })
    });
  });
});
</script>
```

---

## ☁️ Deploy to Render.com (FREE)

1. Go to https://render.com → Sign up free
2. Click "New Web Service"
3. Upload this backend folder (or connect GitHub)
4. Set Environment Variables from your `.env`
5. Deploy! You get a free URL like `https://mullai-banaras-api.onrender.com`

---

## 📁 File Structure

```
mullai-banaras-backend/
├── src/
│   ├── server.js              ← Main entry point
│   ├── config/
│   │   └── database.js        ← MongoDB connection
│   ├── models/
│   │   ├── Enquiry.js         ← Customer enquiry schema
│   │   ├── Saree.js           ← Catalogue schema
│   │   ├── Admin.js           ← Admin user schema
│   │   └── Analytics.js       ← Event tracking schema
│   ├── controllers/
│   │   ├── enquiryController.js
│   │   ├── sareeController.js
│   │   ├── authController.js
│   │   └── analyticsController.js
│   ├── middleware/
│   │   ├── auth.js            ← JWT protection
│   │   └── rateLimiter.js     ← Prevent spam
│   ├── routes/
│   │   └── index.js           ← All API routes
│   └── utils/
│       ├── logger.js          ← Winston logging
│       ├── cache.js           ← In-memory cache
│       └── emailService.js    ← Email notifications
├── public/
│   └── admin.html             ← Admin dashboard UI
├── .env.example               ← Environment template
├── package.json
└── README.md
```

---

## 🔒 Security Features
- JWT authentication for admin
- Rate limiting (100 req/15min globally, 5 enquiries/hour per IP)
- Helmet.js security headers
- Input validation on all forms
- Password hashing with bcrypt
- CORS whitelist

## ⚡ Performance Features  
- MongoDB connection pooling (50 connections)
- In-memory caching (5 min TTL)
- GZIP compression (70% smaller responses)
- Async email sending (doesn't slow down API)
- Database indexes on all query fields

---

*Built for Mullai Banaras · Near Chowk Thateri Bazar, Varanasi*
