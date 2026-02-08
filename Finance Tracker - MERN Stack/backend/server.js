const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// CORS Configuration
// ======================
const allowedOrigins = [
  'https://fintrackhub-app.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In production, still allow for flexibility
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.options('*', cors());
app.use(express.json());

// ======================
// Health Routes (NO DB DEPENDENCY)
// ======================
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Finance Tracker API is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatus = dbStates[mongoose.connection.readyState] || 'unknown';
  res.status(200).json({
    status: 'healthy',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ======================
// API Routes
// ======================
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);

// ======================
// 404 Handler
// ======================
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ======================
// Global Error Handler
// ======================
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

// ======================
// MongoDB Connection (Non-blocking)
// ======================
let isDbConnected = false;

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI environment variable is not set!');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isDbConnected = true;
    console.log('MongoDB Connected');

    // Create admin user after successful connection
    createAdminUser();
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    // Don't crash - just log and continue
    // Will retry on next request or use reconnection
  }
};

// MongoDB reconnection handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB Error:', err.message);
  isDbConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting reconnect...');
  isDbConnected = false;
  // Attempt reconnection after delay
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
  isDbConnected = true;
});

// ======================
// Admin User Creation
// ======================
const User = require('./models/User');

const createAdminUser = async () => {
  try {
    const adminEmail = 'admin5307@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const admin = new User({
        name: 'Admin',
        email: adminEmail,
        password: 'admin@5307',
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user created successfully');
    } else if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('Existing user promoted to admin');
    }
  } catch (err) {
    console.error('Error creating admin:', err.message);
  }
};

// ======================
// Process Error Handlers (Prevent Crashes)
// ======================
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep server running
});

// ======================
// Start Server FIRST, then connect to DB
// ======================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Connect to MongoDB AFTER server is listening
  connectDB();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});
