# EduTrack — Student Portal

A full-stack student portal built with Node.js, Express, MongoDB, and plain HTML/CSS/JS. Students can register, log in, view their profile on a dashboard, and update their details or change their password via the settings page.

---

## Tech Stack

| Layer    | Tech                                                  |
| -------- | ----------------------------------------------------- |
| Frontend | HTML5, CSS3, Vanilla JS (ES6+)                        |
| Backend  | Node.js, Express.js                                   |
| Database | MongoDB via Mongoose                                  |
| Auth     | `express-session` (session-based, httpOnly cookies)   |
| Security | `bcryptjs`, `express-rate-limit`, `express-validator` |

---

## Project Structure

```
edutrack/
├── backend/
│   ├── app.js                    # Express entry point, serves frontend + API
│   ├── .env.example              # Environment variable template
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── routes/
│   │   ├── auth.routes.js        # POST /auth/login, /register, /logout
│   │   ├── dashboard.routes.js   # GET  /dashboard  (protected)
│   │   └── settings.routes.js    # GET|PATCH /settings/profile, POST /settings/password
│   ├── models/
│   │   └── User.js               # Mongoose user schema
│   └── middleware/
│       ├── auth.middleware.js    # Session guard — redirects to login if unauthenticated
│       ├── rateLimiter.js        # express-rate-limit configs for login + register
│       └── validate.js           # express-validator chains + error handler
│
├── frontend/
│   ├── index.html                # Login page
│   ├── register.html             # Registration page
│   ├── dashboard.html            # Student profile dashboard (protected)
│   ├── settings.html             # Profile update + password change (protected)
│   ├── css/
│   │   ├── variables.css         # Design tokens (colors, radii, fonts)
│   │   ├── base.css              # Reset, typography, auth page layout
│   │   ├── layout.css            # App shell, sidebar, topbar, responsive
│   │   └── components.css        # Buttons, cards, forms, alerts, dropdowns
│   ├── js/
│   │   ├── api.js                # fetch wrapper (GET/POST/PATCH + 401 redirect)
│   │   ├── auth.js               # Login + register form logic, client validation
│   │   ├── dashboard.js          # Fetches and renders student profile
│   │   ├── settings.js           # Profile update + password change logic
│   │   └── sidebar.js            # Sidebar collapse, mobile drawer, user dropdown, logout
│   └── assets/
│       └── logo.svg
│
└── .gitignore
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [MongoDB](https://www.mongodb.com/) running locally on port `27017`, **or** a MongoDB Atlas connection string

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/edutrack.git
cd edutrack
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `backend/.env` and fill in your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edutrack
SESSION_SECRET=replace_with_a_long_random_string
NODE_ENV=development
COOKIE_SECURE=false

# Rate limiting (optional — defaults shown)
LOGIN_RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
LOGIN_RATE_LIMIT_MAX=5              # attempts per window per IP

# Session duration
REMEMBER_ME_MAX_AGE_MS=2592000000  # 30 days
SESSION_MAX_AGE_MS=1800000          # 30 minutes
```

> **Never commit your real `.env` file.** It is gitignored by default.

### 4. Start the server

```bash
# development (auto-restarts on file changes)
npm run dev

# production
npm start
```

### 5. Open in browser

```
http://localhost:5000
```

The Express server serves the entire `frontend/` folder as static files, so the full app runs from a single port.

---

## Pages & Routes

| Page      | URL                  | Backend Route                                                                 | Auth Required |
| --------- | -------------------- | ----------------------------------------------------------------------------- | ------------- |
| Login     | `/` or `/index.html` | `POST /auth/login`                                                            | No            |
| Register  | `/register.html`     | `POST /auth/register`                                                         | No            |
| Dashboard | `/dashboard.html`    | `GET /dashboard`                                                              | Yes           |
| Settings  | `/settings.html`     | `GET /settings/profile`, `PATCH /settings/profile`, `POST /settings/password` | Yes           |
| Logout    | —                    | `POST /auth/logout`                                                           | Yes           |

Unauthenticated requests to protected routes are redirected to `/index.html`. API callers receive `401 JSON` instead.

---

## Features

### Authentication

- Session-based auth using `express-session` with httpOnly, sameSite cookies
- Passwords hashed with `bcryptjs` (12 salt rounds)
- Timing-safe login: bcrypt compare always runs to prevent user-enumeration timing attacks
- Generic error message on login failure — does not reveal whether the email exists

### Remember Me

- Unchecked (default): session expires on browser close or after 30 minutes of inactivity
- Checked: session persists for 30 days across browser restarts

### Rate Limiting

- Login: 5 attempts per 15 minutes per IP → `429 Too Many Requests`
- Register: 10 attempts per hour per IP

### Validation

Both client-side (immediate feedback) and server-side (authoritative) validation on all forms:

| Field            | Rules                                                        |
| ---------------- | ------------------------------------------------------------ |
| Full Name        | Letters, spaces, hyphens · 2–60 chars                        |
| Email            | Valid format · unique · normalized to lowercase              |
| Phone            | 10–14 digits · optional leading `+`                          |
| Matric Number    | 4–20 alphanumeric chars, slashes and dashes allowed · unique |
| Department       | Non-empty                                                    |
| Level            | One of: 100L, 200L, 300L, 400L, 500L, 600L                   |
| Date of Birth    | Valid date · age 14–80                                       |
| Password         | ≥ 8 chars · at least one uppercase, lowercase, number        |
| Confirm Password | Must match Password                                          |

Field-level errors appear inline under each input. Duplicate email or matric number returns a specific message on that field.

### Dashboard

Displays the logged-in student's full profile: name, email, phone, matric number, department, level, date of birth, gender, last login, and join date. Skeleton loader shown while fetching.

### Settings

- **Update profile** — edit all registration fields except matric number (read-only after registration)
- **Change password** — requires current password; on success the session is invalidated and the user is redirected to login

### UI

- Sidebar with collapse toggle (state persisted to `localStorage`), mobile drawer with overlay
- Topbar with user avatar, name, email, and dropdown menu
- Fully responsive — sidebar becomes a mobile drawer at ≤ 768 px
- Design tokens in `css/variables.css` — purple primary (`#6B21A8`), pink accent (`#D6249F`), light grey sidebar

---

## Environment Variables Reference

| Variable                     | Default                              | Description                            |
| ---------------------------- | ------------------------------------ | -------------------------------------- |
| `PORT`                       | `5000`                               | Server listen port                     |
| `MONGODB_URI`                | `mongodb://localhost:27017/edutrack` | MongoDB connection string              |
| `SESSION_SECRET`             | —                                    | Long random string for session signing |
| `NODE_ENV`                   | `development`                        | Set to `production` in production      |
| `COOKIE_SECURE`              | `false`                              | Set to `true` when serving over HTTPS  |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | `900000`                             | Login rate-limit window (ms)           |
| `LOGIN_RATE_LIMIT_MAX`       | `5`                                  | Max login attempts per window per IP   |
| `REMEMBER_ME_MAX_AGE_MS`     | `2592000000`                         | Remember-me session duration (30 days) |
| `SESSION_MAX_AGE_MS`         | `1800000`                            | Default session duration (30 min)      |

---

## Scripts

```bash
npm run dev    # Start with nodemon (auto-reload on changes)
npm start      # Start with node (production)
```

---

## Security Notes

- Session cookies are `httpOnly` (inaccessible to JavaScript), `sameSite: lax`
- Set `COOKIE_SECURE=true` and run behind HTTPS in production
- Rotate `SESSION_SECRET` before deploying to production
- MongoDB connection string with credentials should stay in `.env` — never commit it
- Rate limiting is active on login and register endpoints out of the box

---

## License

MIT
