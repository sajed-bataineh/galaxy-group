const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config();

const app = express();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Enhanced MongoDB connection with better error handling
async function connectToMongoDB() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('📍 URI:', process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local MongoDB');
    
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kitchen-admin';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log('✅ Connected to MongoDB successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check your .env file has MONGODB_URI (not MONGO_URI)');
    console.log('2. Verify your MongoDB Atlas credentials');
    console.log('3. Make sure your IP is whitelisted in MongoDB Atlas');
    console.log('4. Check your internet connection');
    
    // Don't exit immediately, let the app run for development
    setTimeout(() => {
      console.log('\n⚠️  App will continue running, but database features won\'t work');
    }, 1000);
  }
}

// Connect to database
connectToMongoDB();

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Session configuration with fallback
app.use(session({
  secret: process.env.SESSION_SECRET || 'kitchen-admin-fallback-secret',
  resave: false,
  saveUninitialized: false,
  store: process.env.MONGODB_URI ? MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // lazy session update
  }) : undefined, // Use memory store if no MongoDB
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  } else {
    return res.redirect('/login');
  }
};

// Make user available in all templates
app.use((req, res, next) => {
  res.locals.currentAdmin = req.session.adminId || null;
  next();
});

// Database connection check middleware
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.render('error', { 
      error: 'قاعدة البيانات غير متاحة حالياً. يرجى المحاولة لاحقاً.',
      title: 'خطأ في قاعدة البيانات'
    });
  }
  next();
};

// Routes
const projectsRouter = require('./routers/projects');
const clientsRouter = require('./routers/clients');
const homeRouter = require('./routers/home');

// Home route
app.get('/dashboard', requireAuth, checkDBConnection, async (req, res) => {
  try {
    const Project = require('./models/Project');
    const Client = require('./models/Client');
    
    const projectsCount = await Project.countDocuments();
    const clientsCount = await Client.countDocuments();
    const recentProjects = await Project.find().sort({ createdAt: -1 }).limit(5);
    const recentClients = await Client.find().sort({ createdAt: -1 }).limit(5);
    
    res.render('dashboard', {
      title: 'لوحة التحكم',
      projectsCount,
      clientsCount,
      recentProjects,
      recentClients
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { 
      error: 'حدث خطأ في تحميل لوحة التحكم',
      title: 'خطأ'
    });
  }
});

// Login routes
app.get('/login', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/');
  }
  res.render('auth/login', { title: 'تسجيل الدخول' });
});

app.post('/login', checkDBConnection, async (req, res) => {
  try {
    const { username, password } = req.body;
    const Admin = require('./models/Admin');
    
    const admin = await Admin.findOne({ 
      $or: [{ username: username }, { email: username }] 
    });

    if (!admin || !await admin.comparePassword(password)) {
      return res.render('auth/login', { 
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        title: 'تسجيل الدخول'
      });
    }

    if (!admin.isActive) {
      return res.render('auth/login', { 
        error: 'حسابك غير مفعل، يرجى التواصل مع المسؤول',
        title: 'تسجيل الدخول'
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    req.session.adminId = admin._id;
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', { 
      error: 'حدث خطأ أثناء تسجيل الدخول',
      title: 'تسجيل الدخول'
    });
  }
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
});

// Use routers with authentication and DB check
app.use('/projects', requireAuth, checkDBConnection, projectsRouter);
app.use('/clients', requireAuth, checkDBConnection, clientsRouter);
app.use('/', homeRouter);

// API routes for AJAX requests
app.get('/api/projects', requireAuth, checkDBConnection, async (req, res) => {
  try {
    const Project = require('./models/Project');
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clients', requireAuth, checkDBConnection, async (req, res) => {
  try {
    const Client = require('./models/Client');
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check route
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.status(200).json(health);
});

// Error handling middleware
// app.use((req, res) => {
//   res.status(404).render('error', { 
//     error: 'الصفحة غير موجودة',
//     title: 'خطأ 404'
//   });
// });

// app.use((err, req, res, next) => {
//   console.error('Application error:', err.stack);
//   res.status(500).render('error', { 
//     error: 'حدث خطأ في الخادم',
//     title: 'خطأ في الخادم'
//   });
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Open your browser and go to: http://localhost:${PORT}`);
  console.log('📊 Health check available at: /health');
});

module.exports = app;