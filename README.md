# Indeed Pakistan Clone — Learning Project

> ⚠️ **DISCLAIMER**: This is a **LEARNING PROJECT** created purely for educational purposes.
> It is **NOT affiliated with, endorsed by, or connected to Indeed Inc.** in any way.
> All company names used in sample data are real Pakistani companies used only as realistic examples.
> This project must NOT be used for commercial purposes.

---

## 📖 Project Overview

A complete full-stack clone of [pk.indeed.com](https://pk.indeed.com) built to learn:
- **Frontend**: React.js + Pure CSS (no Tailwind/Bootstrap)
- **Backend**: Node.js + Express.js REST API
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt password hashing
- **File Upload**: Multer for PDF resume uploads

---

## 🗂️ Project Structure

```
indeed-clone/
├── client/                    ← Frontend (React SPA)
│   ├── src/
│   │   ├── pages/             ← Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── JobsPage.tsx
│   │   │   ├── JobDetailPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── SeekerDashboard.tsx
│   │   │   ├── EmployerDashboard.tsx
│   │   │   └── BackendCodePage.tsx
│   │   ├── components/        ← Reusable UI components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── JobCard.tsx
│   │   │   ├── JobDetailPane.tsx
│   │   │   ├── ApplicationModal.tsx
│   │   │   └── ToastContainer.tsx
│   │   ├── context/           ← React Context (global state)
│   │   │   ├── AuthContext.tsx
│   │   │   └── ToastContext.tsx
│   │   ├── data/
│   │   │   └── mockJobs.ts    ← 17 sample Pakistani jobs
│   │   ├── types/
│   │   │   └── index.ts       ← TypeScript interfaces
│   │   └── utils/
│   │       ├── helpers.ts     ← Utility functions
│   │       └── seedDemoAccounts.ts
│   └── index.html
│
└── server/                    ← Backend (Node.js + Express)
    ├── server.js              ← Entry point
    ├── config/
    │   └── db.js              ← MongoDB connection
    ├── models/
    │   ├── User.js            ← Mongoose User schema
    │   ├── Job.js             ← Mongoose Job schema
    │   └── Application.js     ← Mongoose Application schema
    ├── routes/
    │   ├── authRoutes.js
    │   ├── jobRoutes.js
    │   └── applicationRoutes.js
    ├── controllers/
    │   ├── authController.js
    │   ├── jobController.js
    │   └── applicationController.js
    ├── middleware/
    │   ├── authMiddleware.js  ← JWT verification
    │   └── uploadMiddleware.js ← Multer PDF upload
    └── seed/
        └── seedJobs.js        ← Database seeder
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourname/indeed-pakistan-clone.git
cd indeed-pakistan-clone

# Install all dependencies
npm install
```

### Step 2: Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your values
nano .env
```

Your `.env` should look like:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/indeed_clone
JWT_SECRET=your_very_secret_key_here_make_it_long
```

### Step 3: Start MongoDB

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud) — just update MONGO_URI in .env
```

### Step 4: Seed the Database

```bash
# Inserts 15+ sample jobs and test user accounts
npm run seed
```

This creates:
- **Employer**: `seed@indeed-employer.com` / `Employer123`
- **Seeker**: `seed@indeed-seeker.com` / `Seeker123`

### Step 5: Run the Server

```bash
# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

Server starts at: **http://localhost:5000**

### Step 6: Open the Frontend

The frontend is a static React app. Open `client/index.html` in your browser, or run a simple static server:

```bash
npx serve client/
```

Or use VS Code Live Server extension.

---

## 🔌 API Documentation

### Base URL: `http://localhost:5000/api`

---

### 🔐 Authentication

#### `POST /api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "name": "Ali Khan",
  "email": "ali@example.com",
  "password": "SecurePass123",
  "role": "seeker",
  "company": "Acme Corp"  // Only required for employer role
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f...",
    "name": "Ali Khan",
    "email": "ali@example.com",
    "role": "seeker"
  }
}
```

---

#### `POST /api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "ali@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

#### `GET /api/auth/me`
Get currently logged-in user. **Requires Authorization header.**

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

---

### 💼 Jobs

#### `GET /api/jobs`
Get all jobs with optional filters.

**Query Parameters:**
| Parameter | Type   | Description |
|-----------|--------|-------------|
| search    | string | Search in title, company, description |
| location  | string | Filter by city |
| type      | string | Full-time, Part-time, Contract, Internship |
| salary    | number | Minimum salary filter |
| page      | number | Page number (default: 1) |
| limit     | number | Jobs per page (default: 10) |

**Example:** `GET /api/jobs?search=react&location=lahore&type=Full-time&page=1`

---

#### `GET /api/jobs/:id`
Get a single job by ID.

---

#### `POST /api/jobs`
Create a new job listing. **Employer only. Requires auth.**

**Request Body:**
```json
{
  "title": "Senior React Developer",
  "description": "## About the Role\n\nWe need...",
  "location": "Lahore",
  "salary": { "min": 150000, "max": 250000, "currency": "PKR" },
  "type": "Full-time",
  "skills": ["React", "TypeScript", "Node.js"],
  "deadline": "2025-03-31",
  "remote": false,
  "experience": "3-5 years",
  "category": "Technology"
}
```

---

#### `PUT /api/jobs/:id`
Update a job (only the employer who posted it).

#### `DELETE /api/jobs/:id`
Soft-delete a job (sets isActive = false).

---

### 📬 Applications

#### `POST /api/applications/:jobId`
Apply for a job. Requires auth (seeker role). Multipart form data.

**Form Fields:**
- `resume` (file): PDF file — max 5MB
- `coverLetter` (string): Cover letter text

---

#### `GET /api/applications/my`
Get all applications by the logged-in seeker.

---

#### `GET /api/applications/job/:jobId`
Get all applications for a specific job. Employer only.

---

### 👤 User Profile

#### `PUT /api/users/profile`
Update user profile (name, phone, bio, skills).

#### `POST /api/users/save-job/:id`
Save a job to the user's saved list.

#### `GET /api/users/saved-jobs`
Get the user's saved jobs list.

---

## 🎨 Features

### Job Seeker Features
- ✅ Search jobs by keyword, location, job type, salary
- ✅ Filter by date posted, remote/on-site
- ✅ Save/unsave jobs (heart button)
- ✅ Apply with PDF resume + cover letter
- ✅ Track application status (pending → reviewed → accepted/rejected)
- ✅ Edit profile (name, phone, bio, skills)
- ✅ Upload resume/CV

### Employer Features
- ✅ Post job listings with full details
- ✅ View all posted jobs
- ✅ View applications received per job
- ✅ Update application status (accepted/rejected)
- ✅ Delete/deactivate job listings
- ✅ Company profile management

### UI/UX Features
- ✅ Indeed-style split-view (jobs list + detail pane)
- ✅ Sticky search bar
- ✅ Toast notifications
- ✅ Loading spinners
- ✅ Form validation with error messages
- ✅ Password strength indicator
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Accessibility: focus rings, ARIA labels, keyboard nav

---

## 🧪 Demo Accounts

The app seeds these demo accounts automatically in localStorage:

| Role     | Email                       | Password  |
|----------|-----------------------------|-----------|
| Seeker   | demo.seeker@example.com     | Demo1234  |
| Employer | demo.employer@example.com   | Demo1234  |

---

## 📚 What You Learn from This Project

| Concept | Where in Code |
|---------|---------------|
| React functional components | All `src/pages/` files |
| React useState, useEffect | Every page component |
| React Context API | `src/context/` |
| TypeScript interfaces | `src/types/index.ts` |
| CSS Custom Properties | `src/index.css` — Line 1-50 |
| Flexbox & CSS Grid | `src/index.css` — Layout classes |
| CSS Media Queries | `src/index.css` — Line 650+ |
| Form validation | `LoginPage.tsx`, `SignupPage.tsx` |
| Mongoose Schema | `server/models/` |
| JWT Authentication | `server/middleware/authMiddleware.js` |
| bcrypt password hashing | `server/models/User.js` |
| Multer file upload | `server/middleware/uploadMiddleware.js` |
| Express routing | `server/routes/` |
| MongoDB CRUD | `server/controllers/` |
| Pagination | `server/controllers/jobController.js` |
| Debouncing | `src/utils/helpers.ts` |

---

## 🔧 Available Scripts

```bash
npm start      # Start production server
npm run dev    # Start dev server with nodemon
npm run seed   # Seed database with sample data
```

---

## 📸 Screenshots

| Page | Description |
|------|-------------|
| Home | Hero search + companies + recent jobs |
| Jobs | Three-column: filters + list + preview |
| Job Detail | Full description + apply modal |
| Login/Signup | Role-based auth with validation |
| Seeker Dashboard | Profile, resume, saved jobs, applications |
| Employer Dashboard | Post job, manage listings, view applicants |

---

## 🔒 Security Notes

For a production app, you should also:
- Rate limit login attempts (use `express-rate-limit`)
- Sanitize input to prevent XSS (`express-validator`, `DOMPurify`)
- Use HTTPS only
- Add helmet.js for security headers
- Validate file types on both client AND server
- Use environment-specific CORS settings
- Never expose JWT secret in client code

---

## 📝 License

MIT License — Free to use for learning. See LICENSE file.

---

*Built with ❤️ for learning. Pakistan 🇵🇰*
