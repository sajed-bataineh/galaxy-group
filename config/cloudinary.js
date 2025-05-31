// config/cloudinary.js - إعدادات Cloudinary محدثة
const cloudinary = require('cloudinary').v2;

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// اختبار الاتصال بـ Cloudinary
async function testCloudinaryConnection() {
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', result);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error);
    return false;
  }
}

// رفع ملف إلى Cloudinary
async function uploadFile(filePath, options = {}) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || 'kitchen-projects',
      resource_type: options.resource_type || 'auto',
      ...options
    });
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

// حذف ملف من Cloudinary
async function deleteFile(publicId, resourceType = 'image') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    console.log(`File deleted from Cloudinary: ${publicId}`, result);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
}

// الحصول على معلومات الملف
async function getFileInfo(publicId, resourceType = 'image') {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Error getting file info:', error);
    throw error;
  }
}

// إعدادات مخصصة للفيديوهات
const videoUploadOptions = {
  resource_type: 'video',
  allowed_formats: ['mp4', 'mov', 'avi', 'wmv', 'webm', 'mkv'],
  folder: 'kitchen-projects/videos',
  chunk_size: 6000000, // 6MB chunks
  timeout: 120000 // 2 minutes timeout
};

// إعدادات مخصصة للصور
const imageUploadOptions = {
  resource_type: 'image',
  allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
  folder: 'kitchen-projects/images',
  transformation: [
    { width: 1200, height: 800, crop: 'limit', quality: 'auto' }
  ]
};

module.exports = {
  cloudinary,
  testCloudinaryConnection,
  uploadFile,
  deleteFile,
  getFileInfo,
  videoUploadOptions,
  imageUploadOptions
};

// اختبار الاتصال عند تحميل الملف
testCloudinaryConnection();