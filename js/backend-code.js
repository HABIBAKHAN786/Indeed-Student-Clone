(function (global) {
  'use strict';
  var BACKEND_FILES = [
  {
    path: 'server/server.js',
    language: 'javascript',
    description: 'Express server entry point — sets up middleware, routes, and starts the server.',
    code: `// ============================================================
// SERVER.JS — Express Application Entry Point
// This is the main file that starts your Node.js server.
// Run with: node server/server.js
// Dev mode: nodemon server/server.js
// ============================================================

// Load environment variables from .env file FIRST
require('dotenv').config();

// Import required packages
const express = require('express');
const cors    = require('cors');
const path    = require('path');

// Import our database connection function
const connectDB = require('./config/db');

// Import route handlers (each handles a group of endpoints)
const authRoutes        = require('./routes/authRoutes');
const jobRoutes         = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

// ── Initialize Express App ────────────────────────────────────
const app = express();

// ── Connect to MongoDB ────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────
// Middleware = functions that run on every request before your route handlers

// CORS: Allow requests from your frontend domain
// In production, replace '*' with your actual frontend URL
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON request bodies (req.body will contain the parsed JSON)
app.use(express.json());

// Parse URL-encoded form data (for HTML forms)
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (resumes) as static files
// URL: GET /uploads/resume-123.pdf
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────
// Each route group handles a different resource

// Authentication: /api/auth/signup, /api/auth/login, /api/auth/me
app.use('/api/auth', authRoutes);

// Jobs: /api/jobs (GET, POST), /api/jobs/:id (GET, PUT, DELETE)
app.use('/api/jobs', jobRoutes);

// Applications: /api/applications/:jobId, /api/applications/my
app.use('/api/applications', applicationRoutes);

// ── Health Check Route ────────────────────────────────────────
// Useful for deployment platforms to check if server is running
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Indeed Clone API is running',
    timestamp: new Date().toISOString()
  });
});

// ── 404 Handler ───────────────────────────────────────────────
// Catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────
// Express catches errors thrown in routes and passes them here
// via next(error)
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`🚀 Indeed Clone server running on http://localhost:\${PORT}\`);
  console.log(\`📦 Environment: \${process.env.NODE_ENV || 'development'}\`);
});`,
  },
  {
    path: 'server/config/db.js',
    language: 'javascript',
    description: 'MongoDB connection using Mongoose ODM.',
    code: `// ============================================================
// DB.JS — MongoDB Database Connection
// Uses Mongoose, which is an ODM (Object Document Mapper).
// ODM = it maps MongoDB documents to JavaScript objects.
// ============================================================

const mongoose = require('mongoose');

/**
 * connectDB() — Connects to MongoDB using the URI from .env
 * Called once when server starts.
 */
const connectDB = async () => {
  try {
    // mongoose.connect() returns a promise, so we await it
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options prevent deprecation warnings
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });

    console.log(\`✅ MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    // If connection fails, log the error and exit the process
    console.error(\`❌ MongoDB Connection Error: \${error.message}\`);
    process.exit(1); // Exit with failure code
  }
};

module.exports = connectDB;`,
  },
  {
    path: 'server/models/User.js',
    language: 'javascript',
    description: 'Mongoose schema for User model — both job seekers and employers.',
    code: `// ============================================================
// USER MODEL
// Mongoose schema defines the shape of data stored in MongoDB.
// This model handles both job seekers AND employers (role field).
// ============================================================

const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

// ── Schema Definition ─────────────────────────────────────────
// Schema = blueprint for a MongoDB document
const userSchema = new mongoose.Schema({
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,                 // Remove leading/trailing whitespace
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,               // No two users can have the same email
    lowercase: true,            // Always store email in lowercase
    trim: true,
    match: [/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, 'Please enter a valid email'],
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,              // IMPORTANT: Never include password in query results by default
  },

  role: {
    type: String,
    enum: ['seeker', 'employer'], // Only these two values allowed
    default: 'seeker',
  },

  // Job seeker fields
  phone:    { type: String, default: '' },
  bio:      { type: String, default: '', maxlength: 500 },
  skills:   [{ type: String }],    // Array of skill strings
  resumeUrl:{ type: String, default: '' }, // Path to uploaded resume PDF

  // Saved jobs: array of Job ObjectIds (references)
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  }],

  // Employer-only field
  company: {
    type: String,
    default: '',
    // In a real app you'd add: required: function() { return this.role === 'employer'; }
  },

}, {
  // Automatically adds createdAt and updatedAt timestamps
  timestamps: true,
});

// ── Pre-save Hook: Hash Password ──────────────────────────────
// This runs BEFORE saving a user document to MongoDB.
// bcrypt hashes the password so it's never stored as plain text.
userSchema.pre('save', async function(next) {
  // Only hash if password was actually changed (not on profile updates)
  if (!this.isModified('password')) return next();

  // saltRounds = 12 means bcrypt runs 2^12 = 4096 iterations
  // Higher number = slower but more secure
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance Method: Compare Password ────────────────────────
// Called during login: user.comparePassword(enteredPassword)
userSchema.methods.comparePassword = async function(enteredPassword) {
  // bcrypt.compare checks if the plain text matches the hash
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── Create and export the model ───────────────────────────────
// 'User' = collection name in MongoDB (stored as 'users')
const User = mongoose.model('User', userSchema);
module.exports = User;`,
  },
  {
    path: 'server/models/Job.js',
    language: 'javascript',
    description: 'Mongoose schema for Job listings.',
    code: `// ============================================================
// JOB MODEL
// ============================================================

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({

  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters'],
  },

  description: {
    type: String,
    required: [true, 'Job description is required'],
    minlength: [100, 'Description must be at least 100 characters'],
  },

  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },

  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },

  // Salary is a nested object (sub-document)
  salary: {
    min:      { type: Number, default: 0 },
    max:      { type: Number, default: 0 },
    currency: { type: String, default: 'PKR' },
  },

  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
    required: true,
  },

  skills:   [{ type: String }],
  
  // Reference to the User who posted this job (employer)
  // ObjectId + ref enables Mongoose's "populate()" feature
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  deadline: {
    type: Date,
    required: [true, 'Application deadline is required'],
  },

  remote:     { type: Boolean, default: false },
  experience: { type: String, default: '' },
  category:   { type: String, default: 'Technology' },
  isActive:   { type: Boolean, default: true },

}, { timestamps: true });

// ── Index for fast text search ────────────────────────────────
// MongoDB text index allows full-text search with $text operator
jobSchema.index({ title: 'text', description: 'text', company: 'text' });

// ── Index for fast location queries ──────────────────────────
jobSchema.index({ location: 1 });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;`,
  },
  {
    path: 'server/models/Application.js',
    language: 'javascript',
    description: 'Mongoose schema for job applications.',
    code: `// ============================================================
// APPLICATION MODEL
// Tracks when a seeker applies to a job.
// Status transitions: pending → reviewed → accepted/rejected
// ============================================================

const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  
  // Which job this application is for
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },

  // Who applied
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Path to uploaded resume file (stored by Multer)
  resumeUrl: {
    type: String,
    required: [true, 'Resume is required to apply'],
  },

  coverLetter: {
    type: String,
    default: '',
    maxlength: 1000,
  },

  // Application status lifecycle
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'rejected', 'accepted'],
    default: 'pending',
  },

}, {
  timestamps: { createdAt: 'appliedAt', updatedAt: 'updatedAt' },
});

// ── Compound index ────────────────────────────────────────────
// Prevents a user from applying to the same job twice
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;`,
  },
  {
    path: 'server/controllers/authController.js',
    language: 'javascript',
    description: 'Handles user registration, login, and profile retrieval.',
    code: `// ============================================================
// AUTH CONTROLLER
// Controller = functions that handle the business logic for routes.
// Each function corresponds to one API endpoint.
// ============================================================

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate a JWT token for a user.
 * JWT = JSON Web Token — a signed string containing user data.
 * The frontend stores this and sends it with every protected request.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },               // Payload: data stored IN the token
    process.env.JWT_SECRET,        // Secret key for signing
    { expiresIn: '30d' }          // Token expires in 30 days
  );
};

// ── POST /api/auth/signup ─────────────────────────────────────
const signup = async (req, res) => {
  try {
    // Destructure the request body
    const { name, email, password, role, company } = req.body;

    // Input validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    // .select('+password') overrides the select:false we set in the schema
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user — password gets hashed by the pre-save hook in the model
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      company: role === 'employer' ? company : undefined,
    });

    // Generate token
    const token = generateToken(user._id);

    // Respond with user data (excluding password) and token
    res.status(201).json({
      success: true,
      token,
      user: {
        _id:     user._id,
        name:    user.name,
        email:   user.email,
        role:    user.role,
        company: user.company,
      },
    });

  } catch (error) {
    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user AND include password field (hidden by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      // Don't reveal whether email exists (security best practice)
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare entered password with hashed password using bcrypt
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id:       user._id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        company:   user.company,
        skills:    user.skills,
        resumeUrl: user.resumeUrl,
        savedJobs: user.savedJobs,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────
// Returns the currently logged-in user's data
// Protected route — requires valid JWT token
const getMe = async (req, res) => {
  try {
    // req.user is set by the authMiddleware after verifying the token
    const user = await User.findById(req.user.id)
      .populate('savedJobs', 'title company location'); // Populate refs

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });

  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { signup, login, getMe };`,
  },
  {
    path: 'server/middleware/authMiddleware.js',
    language: 'javascript',
    description: 'JWT verification middleware — protects routes that require authentication.',
    code: `// ============================================================
// AUTH MIDDLEWARE
// Middleware = a function that runs between the request and the
// route handler. It can modify req/res or call next().
//
// This middleware:
// 1. Extracts the JWT from the Authorization header
// 2. Verifies it's valid and not expired
// 3. Attaches the decoded user ID to req.user
// 4. Calls next() to proceed to the route handler
// ============================================================

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — Requires a valid JWT token
 * Usage: router.get('/me', protect, getMe);
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // JWT is sent in the Authorization header as: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized — no token provided' });
    }

    // Verify the token using our secret key
    // jwt.verify() throws an error if invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user's ID to the request object
    // Route handlers can then access req.user.id
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    next(); // Proceed to the route handler

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired — please login again' });
    }
    res.status(500).json({ error: 'Server error in auth middleware' });
  }
};

/**
 * restrictTo — Limits access to specific roles
 * Usage: router.post('/', protect, restrictTo('employer'), createJob);
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: \`Access denied. This action requires the '\${roles.join(' or ')}' role.\`
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };`,
  },
  {
    path: 'server/middleware/uploadMiddleware.js',
    language: 'javascript',
    description: 'Multer file upload middleware — handles PDF resume uploads.',
    code: `// ============================================================
// UPLOAD MIDDLEWARE — Multer Configuration
// Multer is a Node.js middleware for handling multipart/form-data,
// which is the encoding used for file uploads.
// ============================================================

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ── Storage Configuration ─────────────────────────────────────
// diskStorage = save files to disk (vs memoryStorage = in RAM)
const storage = multer.diskStorage({

  // Where to save the uploaded file
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // cb(error, destination) — null = no error
    cb(null, uploadDir);
  },

  // What to name the saved file
  filename: (req, file, cb) => {
    // Create unique filename: userId-timestamp-originalname
    // This prevents filename conflicts
    const uniqueName = \`\${req.user.id}-\${Date.now()}-\${file.originalname.replace(/\\s/g, '_')}\`;
    cb(null, uniqueName);
  },
});

// ── File Filter ───────────────────────────────────────────────
// Only allow PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);  // Accept the file
  } else {
    cb(new Error('Only PDF files are allowed'), false); // Reject
  }
};

// ── Create Multer Upload Instance ─────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maximum file size
  },
});

// Export different upload configurations:
// single('resume') = expect one file with field name 'resume'
module.exports = {
  uploadResume: upload.single('resume'),
};`,
  },
  {
    path: 'server/routes/jobRoutes.js',
    language: 'javascript',
    description: 'Express router defining all job-related API endpoints.',
    code: `// ============================================================
// JOB ROUTES
// Maps HTTP methods + URL paths to controller functions.
//
// Pattern:
// router.METHOD('/path', middleware1, middleware2, controller)
// ============================================================

const express    = require('express');
const router     = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');

// GET  /api/jobs         → Get all jobs (with optional filters)
// POST /api/jobs         → Create new job (employers only)
router.route('/')
  .get(getAllJobs)
  .post(protect, restrictTo('employer'), createJob);

// GET    /api/jobs/:id   → Get single job
// PUT    /api/jobs/:id   → Update job (employer who owns it)
// DELETE /api/jobs/:id   → Delete job (employer who owns it)
router.route('/:id')
  .get(getJobById)
  .put(protect, restrictTo('employer'), updateJob)
  .delete(protect, restrictTo('employer'), deleteJob);

module.exports = router;`,
  },
  {
    path: 'server/controllers/jobController.js',
    language: 'javascript',
    description: 'Business logic for job CRUD operations with filtering and pagination.',
    code: `// ============================================================
// JOB CONTROLLER
// Handles all job-related API logic:
// - Listing with filters (search, location, type, salary)
// - Pagination
// - CRUD operations
// ============================================================

const Job = require('../models/Job');

// ── GET /api/jobs ─────────────────────────────────────────────
// Query params: ?search=react&location=lahore&type=Full-time&page=1&limit=10
const getAllJobs = async (req, res) => {
  try {
    const {
      search   = '',
      location = '',
      type     = '',
      salary   = '',
      remote   = '',
      page     = 1,
      limit    = 10,
    } = req.query;

    // Build MongoDB query object
    const query = { isActive: true };

    // Text search (requires MongoDB text index on the model)
    if (search) {
      query.$text = { $search: search };
    }

    // Location filter (case-insensitive partial match)
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Exact job type match
    if (type) {
      query.type = type;
    }

    // Salary filter (minimum salary)
    if (salary) {
      query['salary.max'] = { $gte: parseInt(salary) };
    }

    // Remote filter
    if (remote === 'true') {
      query.remote = true;
    }

    // Pagination: calculate how many documents to skip
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute the query with pagination
    // .populate() replaces the postedBy ObjectId with the actual User object
    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('postedBy', 'name company email')
        .sort({ createdAt: -1 })  // Newest first
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(query),
    ]);

    res.json({
      success: true,
      jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalJobs: total,
        hasMore: skip + jobs.length < total,
      },
    });

  } catch (error) {
    console.error('getAllJobs error:', error);
    res.status(500).json({ error: 'Error fetching jobs' });
  }
};

// ── GET /api/jobs/:id ─────────────────────────────────────────
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name company email phone');

    if (!job || !job.isActive) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ success: true, job });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }
    res.status(500).json({ error: 'Error fetching job' });
  }
};

// ── POST /api/jobs ────────────────────────────────────────────
const createJob = async (req, res) => {
  try {
    const {
      title, description, location, salary,
      type, skills, deadline, remote, experience, category
    } = req.body;

    const job = await Job.create({
      title,
      description,
      company: req.user.company || req.user.name, // From the logged-in employer
      location,
      salary,
      type,
      skills: skills || [],
      postedBy: req.user._id,
      deadline: new Date(deadline),
      remote:     remote || false,
      experience: experience || '',
      category:   category || 'Technology',
    });

    res.status(201).json({ success: true, job });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Error creating job' });
  }
};

// ── PUT /api/jobs/:id ─────────────────────────────────────────
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Only the employer who posted this job can update it
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this job' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // Return updated doc, run schema validators
    );

    res.json({ success: true, job: updatedJob });

  } catch (error) {
    res.status(500).json({ error: 'Error updating job' });
  }
};

// ── DELETE /api/jobs/:id ──────────────────────────────────────
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }

    // Soft delete: mark as inactive instead of truly deleting
    // This preserves existing applications
    job.isActive = false;
    await job.save();

    res.json({ success: true, message: 'Job listing removed successfully' });

  } catch (error) {
    res.status(500).json({ error: 'Error deleting job' });
  }
};

module.exports = { getAllJobs, getJobById, createJob, updateJob, deleteJob };`,
  },
  {
    path: 'server/controllers/applicationController.js',
    language: 'javascript',
    description: 'Handles job application submission, retrieval, and status updates.',
    code: `// ============================================================
// APPLICATION CONTROLLER
// Handles: submit application, get my applications, 
//          get applications for a job (employer)
// ============================================================

const Application = require('../models/Application');
const Job         = require('../models/Job');
const User        = require('../models/User');

// ── POST /api/applications/:jobId ────────────────────────────
// Job seeker submits an application with resume upload
const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job || !job.isActive) {
      return res.status(404).json({ error: 'Job not found or no longer active' });
    }

    // Check if past deadline
    if (new Date() > new Date(job.deadline)) {
      return res.status(400).json({ error: 'Application deadline has passed' });
    }

    // Check if already applied (unique index will also catch this)
    const existing = await Application.findOne({
      job: jobId,
      applicant: req.user._id,
    });
    if (existing) {
      return res.status(409).json({ error: 'You have already applied for this job' });
    }

    // req.file is set by Multer middleware after upload
    if (!req.file && !req.user.resumeUrl) {
      return res.status(400).json({ error: 'Please upload a resume' });
    }

    // Create application
    const application = await Application.create({
      job:         jobId,
      applicant:   req.user._id,
      resumeUrl:   req.file ? req.file.filename : req.user.resumeUrl,
      coverLetter: coverLetter || '',
    });

    // Populate for the response
    await application.populate([
      { path: 'job', select: 'title company location' },
      { path: 'applicant', select: 'name email' },
    ]);

    res.status(201).json({ success: true, application });

  } catch (error) {
    if (error.code === 11000) { // MongoDB duplicate key error
      return res.status(409).json({ error: 'Already applied to this job' });
    }
    console.error('applyToJob error:', error);
    res.status(500).json({ error: 'Error submitting application' });
  }
};

// ── GET /api/applications/my ──────────────────────────────────
// Job seeker gets their own applications
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate('job', 'title company location salary type')
      .sort({ appliedAt: -1 }); // Most recent first

    res.json({ success: true, applications });

  } catch (error) {
    res.status(500).json({ error: 'Error fetching applications' });
  }
};

// ── GET /api/applications/job/:jobId ─────────────────────────
// Employer gets all applications for their job posting
const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify the employer owns this job
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view these applications' });
    }

    const applications = await Application.find({ job: jobId })
      .populate('applicant', 'name email phone skills resumeUrl')
      .sort({ appliedAt: -1 });

    res.json({ success: true, applications });

  } catch (error) {
    res.status(500).json({ error: 'Error fetching job applications' });
  }
};

// ── PUT /api/applications/:id/status ─────────────────────────
// Employer updates application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('job applicant');

    if (!application) return res.status(404).json({ error: 'Application not found' });

    res.json({ success: true, application });

  } catch (error) {
    res.status(500).json({ error: 'Error updating application status' });
  }
};

module.exports = { applyToJob, getMyApplications, getJobApplications, updateApplicationStatus };`,
  },
  {
    path: 'server/seed/seedJobs.js',
    language: 'javascript',
    description: 'Database seeder — inserts 15+ sample jobs and a test employer account.',
    code: `// ============================================================
// SEED SCRIPT
// Populates the database with sample data for development.
// Run with: npm run seed
// WARNING: Clears existing jobs and seed users before inserting!
// ============================================================

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const User     = require('../models/User');
const Job      = require('../models/Job');
const connectDB = require('../config/db');

const seedData = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...');

    // Clear existing seed data
    await Job.deleteMany({});
    await User.deleteMany({ email: /seed@indeed/ });

    // Create a test employer user
    const employerPassword = await bcrypt.hash('Employer123', 12);
    const employer = await User.create({
      name: 'Systems Limited HR',
      email: 'seed@indeed-employer.com',
      password: employerPassword,
      role: 'employer',
      company: 'Systems Limited',
    });

    // Create a test seeker user  
    const seekerPassword = await bcrypt.hash('Seeker123', 12);
    const seeker = await User.create({
      name: 'Ahmed Khan',
      email: 'seed@indeed-seeker.com',
      password: seekerPassword,
      role: 'seeker',
      skills: ['React', 'Node.js', 'MongoDB'],
    });

    console.log('✅ Test users created');
    console.log('   Employer: seed@indeed-employer.com / Employer123');
    console.log('   Seeker:   seed@indeed-seeker.com  / Seeker123');

    // Sample jobs data (15+ entries)
    const sampleJobs = [
      {
        title: 'Senior React Developer',
        company: 'Systems Limited',
        location: 'Lahore',
        type: 'Full-time',
        salary: { min: 150000, max: 250000, currency: 'PKR' },
        description: '## About the Role\\n\\nWe are looking for an experienced React developer...',
        skills: ['React.js', 'TypeScript', 'Redux', 'Node.js'],
        postedBy: employer._id,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        remote: false,
        category: 'Technology',
      },
      // ... (15+ more jobs as defined in the frontend mockJobs.ts)
    ];

    const jobs = await Job.insertMany(sampleJobs);
    console.log(\`✅ Inserted \${jobs.length} sample jobs\`);
    
    console.log('\\n🎉 Seed complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedData();`,
  },
  {
    path: '.env.example',
    language: 'bash',
    description: 'Environment variables template. Copy to .env and fill in your values.',
    code: `# ============================================================
# ENVIRONMENT VARIABLES
# Copy this file to .env and fill in your actual values.
# NEVER commit .env to Git!
# ============================================================

# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection String
# Local MongoDB: mongodb://localhost:27017/indeed_clone
# MongoDB Atlas: mongodb+srv://<username>:<password>@cluster.mongodb.net/indeed_clone
MONGO_URI=mongodb://localhost:27017/indeed_clone

# JWT Secret Key
# Generate a strong random string for production!
# You can use: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000`,
  },
];
  var selectedIndex = 0;
  var copied = false;

  function renderFileList() {
    var list = document.getElementById('backend-file-list');
    if (!list) return;
    list.innerHTML = BACKEND_FILES.map(function (file, i) {
      var icon = file.path.indexOf('.env') !== -1 ? '🔐' : file.path.endsWith('.js') ? '📄' : '📁';
      var active = i === selectedIndex;
      return '<button class="backend-file-btn' + (active ? ' active' : '') + '" data-index="' + i + '" style="display:block;width:100%;text-align:left;padding:8px 10px;background:' + (active ? '#1e293b' : 'transparent') + ';color:' + (active ? '#60a5fa' : '#94a3b8') + ';border:none;border-radius:6px;cursor:pointer;font-size:12px;font-family:monospace;margin-bottom:2px;">' +
        icon + ' ' + file.path.split('/').pop() +
        '<div style="font-size:10px;color:#475569;margin-top:2px;">' + file.path + '</div></button>';
    }).join('');
    list.querySelectorAll('.backend-file-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedIndex = parseInt(btn.getAttribute('data-index'), 10);
        render();
      });
    });
  }

  function renderCode() {
    var file = BACKEND_FILES[selectedIndex];
    var pathEl = document.getElementById('backend-file-path');
    var descEl = document.getElementById('backend-file-desc');
    var codeEl = document.getElementById('backend-code-content');
    var copyBtn = document.getElementById('backend-copy-btn');
    if (pathEl) pathEl.textContent = file.path;
    if (descEl) descEl.textContent = file.description;
    if (codeEl) codeEl.textContent = file.code;
    if (copyBtn) {
      copyBtn.textContent = copied ? '✅ Copied!' : '📋 Copy';
      copyBtn.style.background = copied ? '#10b981' : '#334155';
    }
  }

  function render() {
    renderFileList();
    renderCode();
  }

  function initBackendCodePage() {
    var copyBtn = document.getElementById('backend-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(BACKEND_FILES[selectedIndex].code);
        copied = true;
        renderCode();
        setTimeout(function () { copied = false; renderCode(); }, 2000);
      });
    }
    render();
  }

  global.IndeedBackend = { initBackendCodePage: initBackendCodePage };
})(window);
