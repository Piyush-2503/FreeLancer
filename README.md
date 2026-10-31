# FreelanceHub

> **One-line pitch:** Send proposals, manage projects, track your work, generate invoices, receive payments, and manage your freelance business from one place.

FreelanceHub is a complete full-stack SaaS application for independent freelancers, developers, designers, content creators, consultants, and small agencies.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Quick Start](#quick-start)
3. [Environment Variables](#environment-variables)
4. [Demo Credentials](#demo-credentials)
5. [Seed Data](#seed-data)
6. [Running Tests](#running-tests)
7. [E-Signature Disclaimer](#e-signature-disclaimer)
8. [Deployment](#deployment)
9. [Webhook Setup (Local Dev)](#webhook-setup-local-dev)
10. [Known Limitations](#known-limitations)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router v7, Axios, @dnd-kit |
| Backend | Node.js, Express.js v5 |
| Database | MongoDB, Mongoose |
| Auth | JWT in HTTP-only cookies, bcrypt |
| Validation | Zod v4 |
| Payment | Razorpay (TEST MODE only) |
| Email | Nodemailer + Ethereal SMTP |
| Scheduling | node-cron |
| PDF | PDFKit |
| E-Signature | signature_pad (frontend canvas) |

---

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB running locally on `127.0.0.1:27017` (Windows Service or `mongod`)

### 1. Clone and install

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure environment

```bash
# Copy the example env file
cp .env.example .env
# Edit .env with your values (see Environment Variables section)
```

### 3. Start development servers

**Terminal 1 — Backend:**
```bash
cd server
node src/server.js
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# App available at http://localhost:5173
```

---

## Environment Variables

All variables live in `.env` at the project root. Copy `.env.example` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | `mongodb://127.0.0.1:27017/freelancehub` |
| `JWT_SECRET` | ✅ | Strong random string (32+ chars) |
| `PORTAL_JWT_SECRET` | ✅ | Separate secret for portal tokens |
| `RAZORPAY_KEY_ID` | ✅ | Must start with `rzp_test_` |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay test secret |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | Set in Razorpay dashboard |
| `CLIENT_URL` | ✅ | `http://localhost:5173` |
| `NODE_ENV` | ✅ | `development` |
| `PORT` | ❌ | Default: `5000` |

---

## Demo Credentials

After running the seed script:

| Field | Value |
|-------|-------|
| Email | `demo@freelancehub.app` |
| Password | `Demo@12345` |

---

## Seed Data

The seed script populates the database with realistic demo data (all items prefixed with `[DEMO]`):

```bash
cd server
node scripts/seed.js
```

> ⚠️ The seed script refuses to run if `NODE_ENV=production`.

The seed creates:
- 1 demo user
- 3 demo clients
- 3 demo projects with tasks
- Time entries
- Invoices (draft, sent, paid)
- Proposals (draft, sent, accepted)
- Contracts (draft, sent)
- Reminder log entries

---

## Running Tests

```bash
cd server
npm test
```

Tests use local MongoDB databases (`freelancehub_test` and `freelancehub_test_clients`) — no in-memory server needed.

**Current status:** `Test Files 2 passed | Tests 22 passed (22)`

---

## E-Signature Disclaimer

> ⚠️ The e-signature feature in FreelanceHub is a **demonstration only**. It is implemented using the `signature_pad` canvas library and is **not legally certified or binding**. Do not use it for legally enforceable agreements. For production use, integrate a certified e-signature provider (DocuSign, HelloSign, etc.).

---

## Deployment

### Frontend → Vercel

1. Connect your GitHub repo to Vercel
2. Set build command: `cd client && npm run build`
3. Set output directory: `client/dist`
4. Set environment variable: `VITE_API_URL` (if needed — the app proxies via `vercel.json` rewrite)

The `client/vercel.json` rewrites all `/api/*` calls to your Render backend URL:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-app.onrender.com/api/$1" }
  ]
}
```

Update `destination` to your Render backend URL.

### Backend → Render

1. Connect your GitHub repo to Render
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `node src/server.js`
5. Set all environment variables (see above)
6. MongoDB: Use MongoDB Atlas — set `MONGODB_URI` to Atlas connection string

> ⚠️ **Render Free Tier Cron Limitation:** The `node-cron` reminder job runs inside the Express server process. On Render's free tier, the server spins down after inactivity. This means cron jobs may not fire on schedule. For reliable reminders in production, use Render's paid tier or an external cron service (e.g., cron-job.org).

### Cookie configuration for cross-domain

When frontend (Vercel) and backend (Render) are on different domains, update `authController.js`:

```js
// In production, cookies need SameSite=None + Secure for cross-domain
const isProd = process.env.NODE_ENV === 'production';
res.cookie('token', token, {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

The recommended approach is to use Vercel rewrites (above) so both frontend and backend appear on the same domain — this lets you keep `SameSite=Lax`.

---

## Webhook Setup (Local Dev)

To test Razorpay webhooks locally, use a tunnel tool like [ngrok](https://ngrok.com):

```bash
# In a new terminal:
ngrok http 5000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Set Razorpay webhook URL to: https://abc123.ngrok.io/api/v1/webhooks/razorpay
# Set RAZORPAY_WEBHOOK_SECRET in .env to match the webhook secret in Razorpay dashboard
```

**Manual webhook simulation (no tunnel needed):**

```bash
cd server
node scripts/webhookSimulate.js <invoiceId>
```

---

## MongoDB Transactions (Local Dev)

Invoice creation from time entries uses MongoDB transactions, which require a **replica set**.

For local development with standalone MongoDB, the transaction will work silently in single-node mode. For correct transaction behavior:

```bash
# Start mongod as a single-node replica set
mongod --replSet rs0 --dbpath "C:\data\db"

# In mongo shell, initialize:
rs.initiate()
```

---

## Known Limitations

- E-signatures are **not legally binding** (demonstration only)
- Razorpay integration is **TEST MODE only** — do not process real payments
- Email uses **Ethereal SMTP** — emails are not delivered; preview URLs are logged to console
- Cron reminders may not fire reliably on Render free tier (see above)
- PDF generation uses PDFKit with basic styling — not print-optimized
