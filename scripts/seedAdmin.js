// scripts/seedAdmin.js - إنشاء مستخدم إداري أولي
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function createInitialAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kitchen-admin');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create initial admin
    const admin = new Admin({
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@kitchen.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      name: {
        ar: 'المدير العام',
        en: 'System Administrator'
      },
      role: 'super_admin',
      isActive: true
    });

    await admin.save();
    console.log('Initial admin user created successfully');
    console.log('Username:', admin.username);
    console.log('Email:', admin.email);
    console.log('Password:', process.env.ADMIN_PASSWORD || 'admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createInitialAdmin();

// scripts/setup.js - إعداد المشروع
const fs = require('fs');
const path = require('path');

function createDirectories() {
  const directories = [
    'public/css',
    'public/js',
    'public/images',
    'public/uploads',
    'views/projects',
    'views/clients',
    'views/auth',
    'models',
    'routers',
    'scripts',
    'middleware'
  ];

  directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

function createEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    const envContent = `PORT=3000
MONGODB_URI=mongodb://localhost:27017/kitchen-admin
SESSION_SECRET=kitchen-admin-super-secret-key-change-in-production

# Cloudinary Configuration (replace with your values)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@kitchen.com
ADMIN_PASSWORD=admin123
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('Created .env file');
  }
}

function createGitignore() {
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    const gitignoreContent = `node_modules/
.env
.env.local
.env.production
.DS_Store
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
public/uploads/*
!public/uploads/.gitkeep
.vscode/
.idea/
`;
    
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('Created .gitignore file');
  }
}

function setup() {
  console.log('Setting up Kitchen Admin System...');
  createDirectories();
  createEnvFile();
  createGitignore();
  console.log('Setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Update your .env file with actual Cloudinary credentials');
  console.log('2. Run: npm install');
  console.log('3. Run: npm run seed (to create initial admin user)');
  console.log('4. Run: npm run dev (for development) or npm start (for production)');
}

setup();

// middleware/auth.js - إضافة middleware للمصادقة
const requireAuth = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  } else {
    return res.redirect('/login');
  }
};

const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.session || !req.session.adminId) {
      return res.redirect('/login');
    }

    const Admin = require('../models/Admin');
    const admin = await Admin.findById(req.session.adminId);
    
    if (!admin || admin.role !== 'super_admin') {
      return res.status(403).render('error', { 
        error: 'ليس لديك صلاحية للوصول لهذه الصفحة' 
      });
    }
    
    req.currentAdmin = admin;
    next();
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
};

module.exports = {
  requireAuth,
  requireSuperAdmin
};

// utils/fileUpload.js - مساعدات رفع الملفات
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// إعداد التخزين للصور
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kitchen-projects/images',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto' }
    ]
  }
});

// إعداد التخزين للفيديوهات
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kitchen-projects/videos',
    allowed_formats: ['mp4', 'mov', 'avi', 'wmv'],
    resource_type: 'video'
  }
});

// إعداد التخزين للشعارات
const logoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kitchen-clients/logos',
    allowed_formats: ['jpg', 'png', 'jpeg', 'svg'],
    transformation: [
      { width: 300, height: 300, crop: 'limit', quality: 'auto' }
    ]
  }
});

const imageUpload = multer({ 
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const videoUpload = multer({ 
  storage: videoStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const logoUpload = multer({ 
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

module.exports = {
  imageUpload,
  videoUpload,
  logoUpload
};