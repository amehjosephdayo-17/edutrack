# CHAPTER THREE: SYSTEM DESIGN AND METHODOLOGY

## 3.1 Introduction

Chapter Two established the intellectual foundation for this project, drawing on a broad body of literature to justify specific design decisions and to identify what a secure, student-facing authentication system needs to achieve. This chapter now takes that foundation and builds something concrete on it. It translates the requirements and insights of the literature review into an actual system design — one that is specific enough to guide implementation and complete enough to communicate the intended architecture clearly to any developer who engages with this report.

The chapter covers five core areas. The methodology section explains the development approach adopted for the project and justifies the choice of tools and technologies. The system overview provides a high-level picture of how all the parts fit together, supported by architecture and use case descriptions. The output design section details what the system presents to the user at each stage of the authentication lifecycle. The input design section specifies the forms, fields, and validation rules through which users interact with the system. Finally, the database design section defines the data structures that the system stores and manages. Together, these sections constitute a complete system design specification.

---

## 3.2 Methodology

### 3.2.1 Development Approach: Adapted Waterfall SDLC

This project follows an adapted waterfall Software Development Life Cycle (SDLC) model, proceeding through the sequential phases of requirements analysis, system design, implementation, testing, and documentation. The waterfall model was chosen because the project has a clearly defined and stable scope, well-understood requirements derived from established security standards, and a single-developer context in which the overhead of agile ceremony would provide little benefit. Its linear structure also produces better documentation artifacts, since each phase must be formally completed and recorded before the next begins.

The model is described as adapted rather than pure waterfall because security testing findings during the testing phase are permitted to feed back into the implementation phase without requiring a full restart of the lifecycle. This limited iteration acknowledges the reality of security-focused development, where testing sometimes reveals implementation decisions that must be revisited. Beyond this specific feedback loop, the phases proceed sequentially and each produces a formal output that forms the input to the next.

### 3.2.2 Choice of Technology Stack

The technology choices for this project were made on the basis of three criteria: security properties, ecosystem maturity and community support, and representativeness of the institutional development contexts targeted by this project. The selected stack — Node.js, Express.js, MongoDB, and HTML5/CSS3/JavaScript — satisfies all three criteria and is examined in detail below.

**Node.js** was selected as the server-side runtime environment because of its widespread adoption, its active package ecosystem through the Node Package Manager (npm), and its asynchronous, event-driven execution model, which suits the I/O-intensive operations — database queries, hashing operations, and session management — that dominate an authentication system. The npm ecosystem provides direct access to security-critical libraries such as bcryptjs (for password hashing), express-session (for session management), express-rate-limit (for brute-force protection), and express-validator (for input validation), all of which are actively maintained and widely vetted by the open-source community.

**Express.js** was selected as the web application framework because it provides the routing and middleware infrastructure needed to implement authentication cleanly and modularly, without imposing an opinionated architecture that might obscure the authentication logic. Its middleware model is directly aligned with the Defense in Depth philosophy: authentication checks are implemented as middleware functions that intercept requests before they reach route handlers, providing a clean, composable security layer.

**MongoDB** was selected as the database management system because of its widespread use in modern JavaScript applications, its flexible document model that suits the evolving structure of student records, and the strong schema enforcement capabilities provided by Mongoose, its primary ODM library for Node.js. As discussed in Chapter Two, Mongoose provides schema-based type enforcement that serves as an effective defense against NoSQL injection attacks, making it not merely an architectural convenience but a genuine security tool.

**HTML5, CSS3, and Vanilla JavaScript** were selected for the frontend because they are the standard technologies of the web, require no build toolchain, and produce interfaces that are universally accessible across browsers and devices. This choice keeps the project accessible and directly applicable in institutional environments where complex frontend build pipelines may not be available.

### 3.2.3 Development Environment

The development environment consists of Visual Studio Code as the primary code editor, Node.js v20 LTS as the runtime, MongoDB Community Edition running as a local service for development, and a web browser for frontend testing. Git is used for version control, with the project repository hosted on GitHub. The project is structured to separate authentication routes, middleware functions, database models, and static frontend assets into clearly delineated directories, following the standard Express.js application convention described in Section 3.6.

---

## 3.3 Overview of the New System Design

### 3.3.1 System Description

The EduTrack Student Portal is a web-based application that enables students to register accounts, authenticate using their credentials, view their academic profile on a protected dashboard, update their profile information, change their password securely, and log out. The system is built on a three-tier architecture comprising the client tier (user-facing HTML/CSS/JavaScript interface), the application tier (Node.js/Express.js server), and the data tier (MongoDB database). Each tier has clearly defined responsibilities and communicates with adjacent tiers through well-defined interfaces, promoting separation of concerns and making each component independently testable and maintainable.

At the application tier, all incoming HTTP requests are processed through a chain of Express.js middleware before reaching route handlers. This middleware chain includes the express-session middleware (which restores session state from the session store for each request), the express-rate-limit middleware (which enforces brute-force protections on authentication endpoints), the express-validator middleware (which validates and sanitizes user-supplied inputs), and the custom authentication middleware (which enforces session-based access control on protected routes). This layered middleware architecture is the practical implementation of the Defense in Depth principle discussed in Chapter Two.

### 3.3.2 System Architecture

The system follows a three-tier architecture:

**Client Layer** — The browser-based user interface, comprising four HTML pages (Login, Register, Dashboard, Settings) styled with plain CSS and driven by Vanilla JavaScript. The frontend communicates with the server exclusively through HTTP requests using the browser's native Fetch API. A dedicated `api.js` module wraps all fetch calls, attaches the session cookie automatically via `credentials: "same-origin"`, and handles 401 (unauthenticated) responses by redirecting the user to the login page.

**Server Layer** — The Node.js/Express.js application, which exposes three groups of routes:

- `/auth/*` — public routes for login, registration, and logout
- `/dashboard` — a protected route that returns the authenticated student's profile data
- `/settings/*` — protected routes for profile update and password change

All routes except `/auth/*` are guarded by the `requireAuth` middleware, which reads the session store on every request and redirects to login if no valid session is found.

**Data Layer** — MongoDB, accessed through Mongoose ODM. A single `users` collection stores one document per registered student. The `express-session` middleware manages session state server-side; the client holds only an opaque session identifier in an httpOnly cookie.

### 3.3.3 Use Cases

The system supports five primary use cases:

| Use Case                         | Actor                 | Precondition   | Outcome                                  |
| -------------------------------- | --------------------- | -------------- | ---------------------------------------- |
| Register New Account             | Student               | Not registered | Account created, redirected to login     |
| Log In                           | Student               | Registered     | Session created, redirected to dashboard |
| View Dashboard                   | Authenticated Student | Valid session  | Student profile displayed                |
| Update Profile / Change Password | Authenticated Student | Valid session  | Record updated in database               |
| Log Out                          | Authenticated Student | Valid session  | Session destroyed, redirected to login   |

---

## 3.4 Output Design

### 3.4.1 Principles of Output Design

Output design in an authentication system carries direct security implications. What the system reveals to the user — and under what circumstances — determines its vulnerability to enumeration and information-leakage attacks. The output design of this system is guided by three principles drawn from the OWASP Authentication Cheat Sheet (2021):

1. **Generic error messaging** — no output reveals whether a failed login was due to an unrecognised email or an incorrect password. The message "Invalid email or password" is returned in both cases, preventing username enumeration.
2. **Proportionate feedback** — the system provides specific, helpful error messages for registration and profile-update failures (identifying the exact field that failed validation), since these contexts do not carry the same enumeration risk as login.
3. **Minimal disclosure** — the dashboard and settings pages display only the authenticated user's own data. No session identifiers, password hashes, or internal system state are ever transmitted to the client.

### 3.4.2 Login Page Output

The login page (`index.html`) presents a clean, centred card layout. On validation failure, an inline alert banner displays the generic error message below the form heading. On success, the server responds with a JSON redirect instruction and the JavaScript client navigates to the dashboard. The Remember Me checkbox, when checked, extends the session duration from 30 minutes to 30 days by setting `req.session.cookie.maxAge` on the server, with no change to the visible interface.

### 3.4.3 Dashboard Output — Protected Page

The dashboard (`dashboard.html`) is the primary protected resource of the system. It is accessible only to users who hold a valid authenticated session. The page renders in a two-panel app shell: a fixed left sidebar carrying the EduTrack logo and navigation links (Dashboard, Settings, Sign Out), and a main content area subdivided into a top bar and a scrollable page body.

The top bar displays a context-sensitive page title, a notification bell, and a user widget showing the authenticated student's initials as a coloured avatar, their full name, and their email address. This information is populated dynamically from the `/dashboard` API endpoint on page load; a skeleton loader is displayed during the fetch to prevent a blank flash of content.

The main content area contains a student profile card displaying ten data fields: Full Name, Email Address, Phone Number, Matric/Student ID, Department, Level (ND 1, ND 2, HND 1, or HND 2), Date of Birth, Gender, Last Login, and Member Since. The card header also shows the student's level as a coloured badge and includes a prominent "Edit Profile" button that navigates to the Settings page.

### 3.4.4 Settings Page Output

The settings page (`settings.html`) shares the same app shell as the dashboard and contains two cards stacked vertically:

**Profile Information card** — pre-populated with the authenticated student's current data loaded from `GET /settings/profile`. All fields except Matric/Student ID are editable. The matric number input is rendered in a disabled state with a helper note reading "Cannot be changed after registration." On successful submission, a green success alert appears inline. On failure, field-level error messages appear beneath the relevant inputs.

**Change Password card** — contains three password fields (Current Password, New Password, Confirm New Password), each with a show/hide toggle. On successful password change, the server destroys the current session, the client shows a success message, and after 1.8 seconds redirects the user to the login page. On failure, the specific error (e.g. "Current password is incorrect") appears beneath the relevant field.

---

## 3.5 Input Design

### 3.5.1 Principles of Input Design

Input design for an authentication system must serve two objectives simultaneously: usability for legitimate users and security against malicious inputs. From a usability standpoint, input design should minimise cognitive effort, provide clear labelling and placeholder guidance, and offer immediate feedback on validation errors. From a security standpoint, it must enforce constraints on format and content, implement both client-side and server-side validation, and never trust user-supplied data without independent server-side verification.

A critical design decision is the level at which validation is enforced. **Client-side validation**, implemented in `auth.js` and `settings.js`, improves usability by providing immediate feedback before the form is submitted, reducing unnecessary server round-trips. **Server-side validation**, implemented through the `express-validator` middleware in `middleware/validate.js`, is the authoritative security layer and cannot be bypassed by disabling JavaScript or submitting crafted HTTP requests directly. Both layers are implemented in this system, with the server-side layer always taking precedence.

### 3.5.2 Registration Form Input Design

The registration form (`register.html`) is divided into three clearly labelled fieldset sections to avoid presenting students with a single intimidating column of inputs:

**Section 1 — Personal Information:**

| Field         | Input Type | Placeholder        | Validation                                         |
| ------------- | ---------- | ------------------ | -------------------------------------------------- |
| Full Name     | text       | e.g. Amaka Johnson | Letters, spaces, hyphens; 2–60 characters          |
| Email Address | email      | you@university.edu | Valid email format; unique in database             |
| Phone Number  | tel        | +2348012345678     | 10–14 digits; optional leading +                   |
| Date of Birth | date       | —                  | Valid date; student age 14–80 years                |
| Gender        | select     | Prefer not to say  | Optional; one of Male / Female / Prefer not to say |

**Section 2 — Academic Information:**

| Field                 | Input Type | Placeholder           | Validation                            |
| --------------------- | ---------- | --------------------- | ------------------------------------- |
| Matric / Student ID   | text       | e.g. 2460113247       | Exactly 10 digits; unique in database |
| Department / Course   | text       | e.g. Computer Science | Non-empty string                      |
| Level / Year of Study | select     | Select level          | One of: ND 1, ND 2, HND 1, HND 2      |

**Section 3 — Set Password:**

| Field            | Input Type | Placeholder         | Validation                                   |
| ---------------- | ---------- | ------------------- | -------------------------------------------- |
| Password         | password   | Enter your password | ≥ 8 characters; upper, lower, digit required |
| Confirm Password | password   | Enter your password | Must match Password exactly                  |

All password fields include a show/hide toggle button rendered as an eye icon. Inline error messages appear beneath each field on validation failure. On successful registration the client displays a green success banner and redirects to the login page after 1.5 seconds.

### 3.5.3 Registration Process Flow

The registration process proceeds as follows:

1. The student opens `register.html` and completes all three sections of the form.
2. On form submission, `auth.js` runs client-side validation. Any field that fails displays an inline error and the form does not submit to the server.
3. If client-side validation passes, `auth.js` calls `API.post("/auth/register", payload)`.
4. The Express server applies the `registerLimiter` rate limiter (maximum 10 requests per hour per IP address). Requests exceeding this limit receive a `429 Too Many Requests` response.
5. The `registerValidation` middleware chain runs all field-level rules via express-validator. Any failure returns `422 Unprocessable Entity` with a field-keyed error object.
6. The route handler checks for duplicate email and matric number in MongoDB. A conflict returns `409 Conflict` with a field-specific error message identifying the offending field.
7. If all checks pass, `bcrypt.hash(password, 12)` produces the password hash. The student document is constructed and saved to MongoDB. The plaintext password is never written to the database.
8. The server returns `201 Created` with `{ success: true, message: "Registration successful." }`. The client displays a success banner and redirects to the login page after 1.5 seconds.

### 3.5.4 Login Form Input Design

The login form (`index.html`) collects only two inputs — Email Address and Password — plus a Remember Me checkbox. This minimal design is deliberate: it reduces cognitive load, aligns with users' established mental model of a login interface, and avoids unnecessary fields that could introduce confusion. The password field includes a show/hide toggle. On any authentication failure, a single alert banner below the form heading displays the generic message "Invalid email or password", regardless of whether the email was unrecognised or the password was incorrect. This generic messaging is a deliberate security control that prevents username enumeration, as discussed in Chapter Two.

### 3.5.5 Login Authentication Process Flow

1. The student submits the login form.
2. `auth.js` performs basic client-side non-empty checks. Any failure shows inline field errors.
3. `API.post("/auth/login", { email, password, rememberMe })` is called.
4. The `loginLimiter` rate limiter (maximum 5 requests per 15 minutes per IP) is evaluated. Excess requests receive `429 Too Many Requests`.
5. The server queries MongoDB for a user document matching the supplied email. If no document is found, a pre-generated `DUMMY_HASH` — produced at server startup by `bcrypt.hashSync()` — is substituted, ensuring the bcrypt comparison still runs and response time is identical to a valid-user lookup. This prevents timing-based email enumeration.
6. `bcrypt.compare(password, hashToCompare)` runs. If the result is false (either unrecognised email or wrong password), the same generic `401` response is returned.
7. On a successful comparison, `req.session.cookie.maxAge` is set to 30 days if `rememberMe` is `true`, or 30 minutes otherwise. `req.session.userId` is set to the user's MongoDB ObjectId. The user's `lastLogin` field is updated in the database.
8. The server returns `{ success: true, redirect: "/dashboard.html" }`. The client navigates to the dashboard.

---

## 3.6 Database Design

### 3.6.1 Overview

The data persistence layer is implemented using MongoDB, a document-oriented NoSQL database. All database interactions are mediated through Mongoose ODM, which enforces schema-level validation and type constraints on every read and write operation — serving as the innermost layer of defense against malformed or injected data, complementing the express-validator layer at the route level.

### 3.6.2 Users Collection — Mongoose Schema

Each registered student is represented by a single document in the `users` collection. The Mongoose schema enforces the following structure:

| Field          | Type   | Constraints                                                       |
| -------------- | ------ | ----------------------------------------------------------------- |
| `fullName`     | String | Required; trimmed                                                 |
| `email`        | String | Required; unique; lowercase; trimmed                              |
| `phone`        | String | Required; trimmed                                                 |
| `matricNumber` | String | Required; unique; trimmed                                         |
| `department`   | String | Required; trimmed                                                 |
| `level`        | String | Required; enum: ND 1, ND 2, HND 1, HND 2                          |
| `dateOfBirth`  | Date   | Required                                                          |
| `gender`       | String | Optional; enum: Male, Female, Prefer not to say                   |
| `passwordHash` | String | Required — stores only the bcrypt hash, never the plaintext value |
| `lastLogin`    | Date   | Updated on each successful login                                  |
| `createdAt`    | Date   | Default: `Date.now` (set once at document creation; not updated)  |

The `email` and `matricNumber` fields carry unique indexes enforced at both the Mongoose schema level and the MongoDB collection level. The `passwordHash` field stores only the output of `bcrypt.hash(password, 12)`. The plaintext password is discarded immediately after hashing and is never persisted anywhere in the system.

### 3.6.3 Session Management

Server-side session state is managed by the `express-session` middleware. Each session record associates an opaque, cryptographically random session identifier with the authenticated student's `userId`. The session identifier is transmitted to the browser as an httpOnly cookie with the following security attributes:

| Attribute  | Value                                         | Purpose                                                                                   |
| ---------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `httpOnly` | `true`                                        | Prevents client-side JavaScript from reading the cookie, blocking XSS-based session theft |
| `secure`   | Configurable via `COOKIE_SECURE` env          | Restricts transmission to HTTPS connections in production                                 |
| `sameSite` | `lax`                                         | Reduces exposure to cross-site request forgery                                            |
| `maxAge`   | 30 minutes (default) or 30 days (Remember Me) | Controls session lifetime                                                                 |

### 3.6.4 Application File Structure

The project is organised into the following directory layout, reflecting the MVC pattern adapted for Express.js:

```
edutrack/
├── backend/
│   ├── app.js                   # Entry point: middleware, routes, static file serving
│   ├── .env.example             # Environment variable template (committed to version control)
│   ├── config/db.js             # MongoDB connection via Mongoose
│   ├── models/User.js           # Mongoose User schema and model
│   ├── routes/
│   │   ├── auth.routes.js       # POST /auth/login, /auth/register, /auth/logout
│   │   ├── dashboard.routes.js  # GET  /dashboard (protected)
│   │   └── settings.routes.js   # GET|PATCH /settings/profile; POST /settings/password
│   └── middleware/
│       ├── auth.middleware.js   # requireAuth session guard
│       ├── rateLimiter.js       # loginLimiter and registerLimiter configurations
│       └── validate.js          # express-validator chains + handleValidationErrors
├── frontend/
│   ├── index.html               # Login page
│   ├── register.html            # Registration page
│   ├── dashboard.html           # Protected student profile dashboard
│   ├── settings.html            # Protected profile update and password change page
│   ├── css/
│   │   ├── variables.css        # CSS custom properties (design tokens)
│   │   ├── base.css             # Reset, typography, auth page layout
│   │   ├── layout.css           # App shell, sidebar, topbar, responsive breakpoints
│   │   └── components.css       # Buttons, cards, forms, alerts, dropdowns
│   ├── js/
│   │   ├── api.js               # Fetch wrapper (GET / POST / PATCH + automatic 401 redirect)
│   │   ├── auth.js              # Login and register form logic with client-side validation
│   │   ├── dashboard.js         # Fetches and renders the authenticated student's profile
│   │   ├── settings.js          # Profile update and password change logic
│   │   └── sidebar.js           # Sidebar collapse, mobile drawer, user dropdown, logout
│   └── assets/logo.svg
└── .gitignore
```

The use of a `.env` file for sensitive configuration — particularly the `SESSION_SECRET`, which must be a long, cryptographically random string — follows the Twelve-Factor App methodology for configuration management. This ensures that secret values are never hard-coded in source code and are never committed to version control. The `.env` file is listed in `.gitignore`; only the `.env.example` template file, containing placeholder values, is committed to the repository.

---

## 3.7 Chapter Summary

This chapter has translated the theoretical foundation established in Chapter Two into a concrete, detailed system design for the EduTrack Student Portal. The methodology section justified the choice of the adapted waterfall SDLC and documented the selection of the Node.js, Express.js, MongoDB, and HTML5/CSS3/JavaScript technology stack, explaining the security properties that make each component appropriate for the application context.

The system overview presented the three-tier architecture and the five core use cases that define the functional scope of the system. The output design section specified what the system communicates to users at each stage — login, registration, dashboard, and settings — with particular attention to the security-motivated decision to use generic error messaging for authentication failures. The input design section defined both forms in full, documenting the two-layer validation architecture and describing the complete flow of both the registration and login processes. The database design section defined the MongoDB Users collection schema, the session cookie security configuration, and the application file structure.

Together, these design artifacts constitute a complete and implementation-ready specification. Chapter Four proceeds to describe the implementation of this design in working code and the testing and evaluation of the implemented system against functional and security criteria.

---

# CHAPTER FOUR: IMPLEMENTATION AND TESTING

## 4.1 Introduction

Chapter Three produced a complete system design specification: the architecture, the data model, the form layouts, the validation rules, and the security controls were all defined before a single line of implementation code was written. This chapter describes how that design was translated into a working system, and how the working system was then verified against the functional and security requirements established in Chapter One.

The chapter is organised into three parts. The implementation section walks through each major component of the system — the Express application entry point, the authentication routes, the session and rate-limiting middleware, the input validation middleware, the access control guard, the Mongoose data model, and the frontend pages — explaining the key decisions made during construction and quoting the relevant code where doing so illuminates the design. The testing section documents the test cases executed, the expected and actual outcomes, and the evidence that the system correctly implements the security controls it was designed to provide. The chapter closes with a summary of implementation outcomes and a discussion of the extent to which the completed system satisfies the project objectives stated in Chapter One.

---

## 4.2 Implementation

### 4.2.1 Application Entry Point — app.js

The `app.js` file is the central assembly point of the backend. It is responsible for loading environment variables, connecting to MongoDB, configuring all Express middleware, mounting the route handlers, and instructing Express to serve the frontend as static files. The order in which middleware is registered is significant: Express processes middleware in the order it is added, so security-critical components such as session management must be registered before the route handlers that depend on them.

```javascript
require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const settingsRoutes = require("./routes/settings.routes");

connectDB();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_this_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: parseInt(process.env.SESSION_MAX_AGE_MS) || 1800000,
    },
  }),
);

app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/settings", settingsRoutes);

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});
```

The `express.static()` call at the bottom of the middleware stack instructs Express to serve any file whose path matches a file in the `frontend/` directory directly, without passing through any route handler. Requests for `/dashboard.html`, `/css/base.css`, and `/js/auth.js` are all resolved by this single line. Because the API routes (`/auth`, `/dashboard`, `/settings`) are registered before the static middleware, API calls are matched and handled first and never reach the static file server.

The session is configured with `saveUninitialized: false`, which means a new session record is only written to the store when something is actually stored in it — preventing the session store from filling up with empty sessions from unauthenticated visitors. The `resave: false` option prevents the session from being re-saved to the store on every request if nothing in it changed, reducing unnecessary write operations.

### 4.2.2 Password Hashing and the DUMMY_HASH Pattern

Password hashing is implemented in `routes/auth.routes.js` using the `bcryptjs` library. The salt rounds are set to 12, which represents the current recommended minimum for bcrypt and produces a hash in approximately 250–400 milliseconds on typical server hardware — slow enough to make offline brute-force attacks computationally expensive, but fast enough to be imperceptible to a user logging in.

```javascript
const bcrypt = require("bcryptjs");

// Generated once at module load — used for timing-safe comparison
// when the queried email does not exist in the database.
const DUMMY_HASH = bcrypt.hashSync("timing-safe-dummy-password", 12);
```

The `DUMMY_HASH` is computed once when the module is first loaded, using `hashSync` (the synchronous variant of `hash`). It is a genuine bcrypt hash of an arbitrary string. When a login attempt is made for an email that does not exist in the database, `bcrypt.compare()` is called against this dummy hash rather than being skipped. This ensures that the time taken to respond to a login attempt is identical whether or not the email exists, making it impossible for an attacker to determine valid email addresses by measuring response times. Without this measure, a fast "user not found" response would allow enumeration of registered emails at scale.

```javascript
const user = await User.findOne({ email: email.toLowerCase() });
const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
const isMatch = await bcrypt.compare(password, hashToCompare);

if (!user || !isMatch) {
  return res
    .status(401)
    .json({ success: false, message: "Invalid email or password." });
}
```

Note that the same `401` response and the same message are returned regardless of whether `!user` or `!isMatch` was the failing condition. This is intentional and aligns with the OWASP recommendation against revealing which component of a credential pair was incorrect.

### 4.2.3 Rate Limiting — middleware/rateLimiter.js

Rate limiting is implemented using the `express-rate-limit` package, configured in a dedicated `middleware/rateLimiter.js` file and imported into the authentication routes. Separating the configuration from the route file keeps each file focused on a single responsibility and makes the limits easy to adjust without touching route logic.

```javascript
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

const registerLimiter = rateLimit({
  windowMs: 3600000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later.",
  },
});
```

The login limiter window and maximum are read from environment variables, making them configurable without code changes. The `standardHeaders: true` option causes the middleware to include `RateLimit-*` headers in responses, which well-behaved API clients can use to implement back-off behaviour. Both limiters return a structured JSON error body, consistent with the rest of the API's error format.

### 4.2.4 Input Validation — middleware/validate.js

All user-supplied inputs are validated and sanitised server-side using `express-validator` before they reach the database layer. The validation rules are defined as reusable constants and composed into named chains for each endpoint.

Key validation rules include:

```javascript
const ALLOWED_LEVELS = ["ND 1", "ND 2", "HND 1", "HND 2"];
const MATRIC_PATTERN = /^[0-9]{10}$/;

const fullNameRules = body("fullName")
  .trim()
  .notEmpty()
  .withMessage("Full name is required.")
  .matches(/^[A-Za-z\s\-]{2,60}$/)
  .withMessage(
    "Full name must be 2–60 characters (letters, spaces, hyphens only).",
  );

const passwordRules = body("password")
  .notEmpty()
  .withMessage("Password is required.")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters.")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter.")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter.")
  .matches(/[0-9]/)
  .withMessage("Password must contain at least one number.");

const dateOfBirthRules = body("dateOfBirth")
  .notEmpty()
  .withMessage("Date of birth is required.")
  .isDate()
  .withMessage("Enter a valid date of birth.")
  .custom((value) => {
    const dob = new Date(value);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    if (age < 14 || age > 80)
      throw new Error("Age must be between 14 and 80 years.");
    return true;
  });
```

The `handleValidationErrors` middleware reads the result of all preceding validator calls and, if any errors are present, returns a `422` response with a field-keyed error object:

```javascript
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fieldErrors = {};
    errors.array().forEach((err) => {
      if (!fieldErrors[err.path]) fieldErrors[err.path] = err.msg;
    });
    return res.status(422).json({ success: false, errors: fieldErrors });
  }
  next();
};
```

Only the first error per field is returned, keeping the response compact. The client-side JavaScript in `auth.js` and `settings.js` reads this `errors` object and places each message beneath the corresponding form input.
