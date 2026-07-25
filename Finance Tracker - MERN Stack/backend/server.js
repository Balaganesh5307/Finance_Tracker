const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (dnsErr) {
  console.warn('DNS server setting failed, using system defaults:', dnsErr.message);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const subscriptionRoutes = require('./routes/subscriptions');
const budgetRoutes = require('./routes/budgets');
const goalRoutes = require('./routes/goals');
const cronService = require('./services/cronService');

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
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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
// Health Routes
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
app.use('/api/ai', aiRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);

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

    // Create/promote admin users after successful connection
    createAdminUsers();
    cronService.initSchedules();
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
  }
};

mongoose.connection.on('error', (err) => {
  console.error('MongoDB Error:', err.message);
  isDbConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting reconnect...');
  isDbConnected = false;
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
  isDbConnected = true;
});

// ======================
// Admin User Seeding
// ======================
const User = require('./models/User');

const createAdminUsers = async () => {
  try {
    const admins = [
      { name: 'Admin', email: 'admin5307@gmail.com', password: 'admin@5307' },
      { name: 'Balaganesh Admin', email: 'balaganesh.masterad@gmail.com', password: 'admin@balaganesh' }
    ];

    for (const adminInfo of admins) {
      const existingUser = await User.findOne({ email: adminInfo.email });
      if (!existingUser) {
        const admin = new User({
          name: adminInfo.name,
          email: adminInfo.email,
          password: adminInfo.password,
          role: 'admin'
        });
        await admin.save();
        console.log(`Admin user ${adminInfo.email} created successfully`);
      } else if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log(`Existing user ${adminInfo.email} promoted to admin`);
      }
    }
  } catch (err) {
    console.error('Error seeding admin accounts:', err.message);
  }
};

// ======================
// Process Error Handlers
// ======================
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// ======================
// Start Server
// ======================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
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
