# EduTrack — Student Portal

A full-stack student portal with secure email-based OTP verification for registration and password reset. Students can register with email verification, log in, view their profile on a protected dashboard, update their details, change their password, and recover forgotten passwords securely.

---

## Tech Stack

| Layer    | Technology                                                          |
| -------- | ------------------------------------------------------------------- |
| Frontend | HTML5, CSS3, Vanilla JS (ES6+)                                      |
| Backend  | Node.js, Express.js                                                 |
| Database | MongoDB via Mongoose                                                |
| Auth     | `express-session` (session-based, httpOnly cookies)                 |
| Email    | `nodemailer` (OTP delivery via Gmail or SMTP)                       |
| Security | `bcryptjs`, `express-rate-limit`, `express-validator`, `nodemailer` |

---

## Project Structure

```
edutrack/
├── backend/
│   ├── app.js                         # Express entry point
│   ├── .env.example                   # Environment template
│   ├── config/
│   │   └── db.js                      # MongoDB connection
│   ├── routes/
│   │   ├── auth.routes.js             # Authentication with OTP
│   │   ├── dashboard.routes.js        # Student dashboard (protected)
│   │   ├── settings.routes.js         # Profile & password (protected)
│   │   └── forgot-password.routes.js  # Password reset with OTP
│   ├── models/
│   │   └── User.js                    # User schema with OTP fields
│   ├── services/
│   │   └── otpService.js              # OTP generation and email
│   └── middleware/
│       ├── auth.middleware.js         # Session guard
│       ├── rateLimiter.js             # Rate limiting
│       ├── validate.js                # Input validation
│       └── otpValidation.js           # OTP validation
│
├── frontend/
│   ├── index.html                     # Login
│   ├── register.html                  # Registration
│   ├── verify-otp.html                # OTP verification (reusable)
│   ├── reset-password.html            # Password reset
│   ├── dashboard.html                 # Student profile (protected)
│   ├── settings.html                  # Settings (protected)
│   ├── forgot-password.html           # Forgot password request
│   ├── css/
│   │   ├── variables.css              # Design tokens
│   │   ├── base.css                   # Typography, layout
│   │   ├── layout.css                 # App shell, responsive
│   │   └── components.css             # UI components
│   ├── js/
│   │   ├── api.js                     # Fetch wrapper
│   │   ├── auth.js                    # Login & register
│   │   ├── verify-otp.js              # OTP input handling
│   │   ├── reset-password.js          # Password reset form
│   │   ├── dashboard.js               # Profile display
│   │   ├── settings.js                # Settings logic
│   │   ├── sidebar.js                 # Navigation
│   │   └── forgot-password.js         # Forgot password flow
│   └── assets/
│       └── logo.svg
│
└── .gitignore
```

---

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Email account (Gmail with App Password or custom SMTP)

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/ameh-samson/edutrack.git
cd edutrack/backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=generate_a_long_random_string
NODE_ENV=development
COOKIE_SECURE=false

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@edutrack.com

# Rate Limiting
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=5

# Session Duration
SESSION_MAX_AGE_MS=1800000
REMEMBER_ME_MAX_AGE_MS=86400000
```

**Gmail Setup:** Enable 2FA and create an [App Password](https://myaccount.google.com/apppasswords). Use the 16-char password as `EMAIL_PASSWORD`.

**Custom SMTP:** Set `EMAIL_SERVICE=custom` and add:

```env
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

### 3. Start Server

```bash
npm run dev    # development with auto-restart
npm start      # production
```

Visit `http://localhost:5000`

---

## Features

### OTP-Based Email Verification

**Registration Flow:**

- User submits registration form → OTP sent to email (10-min expiry)
- User verifies email via 6-digit OTP code
- Account created only after successful verification
- User can now log in

**Password Reset Flow:**

- User verifies identity (email + matric number) → OTP sent
- User verifies OTP code
- User sets new password
- User can log in with new password

**OTP Features:**

- 6-digit numeric codes with 10-minute expiry
- Professional HTML email templates
- Auto-focus between digit input fields
- Paste support (enter all 6 digits at once)
- Visual countdown timer with expiry warning
- Max 5 failed attempts before requesting new OTP
- Rate-limited OTP requests (same as registration limits)

### Authentication & Security

- Email verification required before login
- Session-based auth with httpOnly, `sameSite: lax` cookies
- Passwords hashed with bcryptjs (12 salt rounds)
- Timing-safe login (constant-time comparison prevents email enumeration)
- Generic error messaging (no hint if email or password wrong)
- Rate limiting: 5 login attempts per 15 minutes per IP
- Rate limiting: 10 registration attempts per hour per IP

### User Experience

- **Already Logged In:** Visiting login/register page redirects to dashboard
- **Remember Me:** Unchecked = 30-min session; Checked = 24-hour session
- **Responsive Design:** Desktop sidebar, mobile drawer navigation
- **Skeleton Loaders:** Smooth loading states for profile data
- **Inline Validation:** Both client-side (immediate) and server-side (authoritative)

### Dashboard & Settings

- **Dashboard:** View complete profile (name, email, matric, department, level, DOB, gender, last login, join date)
- **Settings:** Update profile (matric number read-only) and change password
- **Session Invalidation:** Logging out on another device invalidates current session

---

## API Endpoints

### Authentication

| Endpoint                            | Method | Purpose                       |
| ----------------------------------- | ------ | ----------------------------- |
| `/auth/me`                          | GET    | Check if logged in            |
| `/auth/login`                       | POST   | Log in with credentials       |
| `/auth/logout`                      | POST   | Log out (destroy session)     |
| `/auth/register/request-otp`        | POST   | Submit registration, send OTP |
| `/auth/register/verify-otp`         | POST   | Verify OTP, create account    |
| `/auth/forgot-password/request-otp` | POST   | Verify identity, send OTP     |
| `/auth/forgot-password/verify-otp`  | POST   | Verify OTP for reset          |
| `/auth/forgot-password/reset`       | POST   | Set new password              |

### Protected Routes

| Endpoint             | Method | Purpose                          |
| -------------------- | ------ | -------------------------------- |
| `/dashboard`         | GET    | Get authenticated user's profile |
| `/settings/profile`  | GET    | Get profile data                 |
| `/settings/profile`  | PATCH  | Update profile                   |
| `/settings/password` | POST   | Change password                  |

---

## Validation Rules

| Field         | Rules                                                     |
| ------------- | --------------------------------------------------------- |
| Full Name     | 2–60 chars, letters/spaces/hyphens only                   |
| Email         | Valid format, unique, normalized to lowercase             |
| Phone         | 10–14 digits, optional leading `+`                        |
| Matric Number | Exactly 10 digits, unique per verified account            |
| Department    | Non-empty string                                          |
| Level         | One of: ND 1, ND 2, HND 1, HND 2                          |
| Date of Birth | Valid date, age 14–80                                     |
| Password      | ≥8 chars, 1 uppercase, 1 lowercase, 1 number              |
| OTP Code      | Exactly 6 digits, within 10-minute window, max 5 attempts |

---

## Security Notes

- Session cookies are `httpOnly` and `sameSite: lax`
- Set `COOKIE_SECURE=true` when serving over HTTPS
- Generate a fresh `SESSION_SECRET` for each deployment
- Keep `.env` (especially `MONGODB_URI` and email credentials) out of version control
- Rate limiting protects against brute-force attacks
- OTP expiry and attempt limits prevent unauthorized account recovery
- Email verification prevents spam registrations

---

## Environment Variables

| Variable                     | Default       | Description                            |
| ---------------------------- | ------------- | -------------------------------------- |
| `PORT`                       | `5000`        | Server port                            |
| `MONGODB_URI`                | —             | MongoDB connection string              |
| `SESSION_SECRET`             | —             | Long random string for session signing |
| `NODE_ENV`                   | `development` | Set to `production` in production      |
| `COOKIE_SECURE`              | `false`       | Set to `true` for HTTPS                |
| `EMAIL_SERVICE`              | `gmail`       | Email service: `gmail` or `custom`     |
| `EMAIL_USER`                 | —             | Email account username                 |
| `EMAIL_PASSWORD`             | —             | Email account password or app password |
| `EMAIL_FROM`                 | `EMAIL_USER`  | Display email (optional)               |
| `EMAIL_HOST`                 | —             | SMTP host (required if custom)         |
| `EMAIL_PORT`                 | `587`         | SMTP port                              |
| `EMAIL_SECURE`               | `false`       | Use TLS                                |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | `900000`      | 15 minutes                             |
| `LOGIN_RATE_LIMIT_MAX`       | `5`           | Max attempts per window                |
| `SESSION_MAX_AGE_MS`         | `1800000`     | 30 minutes (standard session)          |
| `REMEMBER_ME_MAX_AGE_MS`     | `86400000`    | 24 hours (remember me)                 |

---

## License

MIT
