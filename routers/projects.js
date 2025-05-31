// routers/projects.js - نسخة محدثة مع دعم كامل للفيديوهات
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Project = require('../models/Project');

// إعداد Cloudinary للصور
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

// إعداد Cloudinary للفيديوهات
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kitchen-projects/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'wmv', 'webm'],
    // لا نضع transformation للفيديوهات لتجنب المشاكل
  }
});

// إعداد multer مع دعم أنواع ملفات مختلفة
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // تحديد نوع الملف والمجلد حسب نوع الملف
    if (file.mimetype.startsWith('video/')) {
      return {
        folder: 'kitchen-projects/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'avi', 'wmv', 'webm', 'mkv', '3gp'],
      };
    } else {
      return {
        folder: 'kitchen-projects/images',
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
        transformation: [
          { width: 1200, height: 800, crop: 'limit', quality: 'auto' }
        ]
      };
    }
  }
});

// إعداد multer مع حدود أكبر للفيديوهات
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB للفيديوهات
    files: 20 // حد أقصى 20 ملف
  },
  fileFilter: (req, file, cb) => {
    // التحقق من نوع الملف
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm', 'video/mkv', 'video/3gp'];
    
    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`نوع الملف غير مدعوم: ${file.mimetype}. الأنواع المدعومة: الصور (jpg, png, webp) والفيديوهات (mp4, mov, avi, wmv)`), false);
    }
  }
});

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.render('projects/index', { 
      projects, 
      title: 'إدارة المشاريع',
      success: req.query.success 
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).render('error', { error: 'خطأ في تحميل المشاريع' });
  }
});

// Show create project form
router.get('/create', (req, res) => {
  res.render('projects/create', { title: 'إضافة مشروع جديد' });
});

// Create new project
router.post('/create', (req, res) => {
  // استخدام middleware مخصص للتعامل مع الأخطاء
  upload.fields([
    { name: 'beforeImages', maxCount: 10 },
    { name: 'afterImages', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
  ])(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      let errorMessage = 'خطأ في رفع الملفات';
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        errorMessage = 'حجم الملف كبير جداً. الحد الأقصى 100 ميجابايت';
      } else if (err.message.includes('نوع الملف غير مدعوم')) {
        errorMessage = err.message;
      }
      
      return res.status(400).render('projects/create', {
        error: errorMessage,
        title: 'إضافة مشروع جديد'
      });
    }

    try {
      console.log('Files received:', req.files);
      console.log('Body received:', req.body);

      const projectData = {
        name: {
          ar: req.body.nameAr,
          en: req.body.nameEn
        },
        location: {
          ar: req.body.locationAr,
          en: req.body.locationEn
        },
        duration: req.body.duration,
        description: {
          ar: req.body.descriptionAr || '',
          en: req.body.descriptionEn || ''
        },
        status: req.body.status || 'active',
        beforeImages: [],
        afterImages: [],
        videos: []
      };

      // معالجة صور قبل التنفيذ
      if (req.files.beforeImages) {
        projectData.beforeImages = req.files.beforeImages.map(file => ({
          url: file.path,
          publicId: file.filename
        }));
        console.log('Before images processed:', projectData.beforeImages.length);
      }

      // معالجة صور بعد التنفيذ
      if (req.files.afterImages) {
        projectData.afterImages = req.files.afterImages.map(file => ({
          url: file.path,
          publicId: file.filename
        }));
        console.log('After images processed:', projectData.afterImages.length);
      }

      // معالجة الفيديوهات
      if (req.files.videos) {
        projectData.videos = req.files.videos.map((file, index) => ({
          url: file.path,
          publicId: file.filename,
          title: {
            ar: req.body[`videoTitleAr_${index}`] || `فيديو ${index + 1}`,
            en: req.body[`videoTitleEn_${index}`] || `Video ${index + 1}`
          }
        }));
        console.log('Videos processed:', projectData.videos.length);
      }

      const project = new Project(projectData);
      await project.save();

      console.log('Project created successfully:', project._id);
      res.redirect('/projects?success=' + encodeURIComponent('تم إنشاء المشروع بنجاح'));
    } catch (error) {
      console.error('Error creating project:', error);
      
      // في حالة خطأ، نحذف الملفات التي تم رفعها
      if (req.files) {
        const filesToDelete = [];
        Object.values(req.files).flat().forEach(file => {
          if (file.filename) {
            filesToDelete.push(file.filename);
          }
        });
        
        // حذف الملفات من Cloudinary
        filesToDelete.forEach(async (publicId) => {
          try {
            await cloudinary.uploader.destroy(publicId);
            await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
          } catch (deleteError) {
            console.error('Error deleting file:', deleteError);
          }
        });
      }
      
      res.status(400).render('projects/create', {
        error: 'خطأ في إنشاء المشروع: ' + error.message,
        title: 'إضافة مشروع جديد'
      });
    }
  });
});

// Show project details
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).render('error', { error: 'المشروع غير موجود' });
    }
    res.render('projects/show', { 
      project, 
      title: project.name.ar,
      success: req.query.success 
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).render('error', { error: 'خطأ في تحميل المشروع' });
  }
});

// Show edit project form
router.get('/:id/edit', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).render('error', { error: 'المشروع غير موجود' });
    }
    res.render('projects/edit', { 
      project, 
      title: 'تعديل المشروع',
      success: req.query.success 
    });
  } catch (error) {
    console.error('Error fetching project for edit:', error);
    res.status(500).render('error', { error: 'خطأ في تحميل المشروع للتعديل' });
  }
});

// Update project
router.put('/:id', (req, res) => {
  upload.fields([
    { name: 'beforeImages', maxCount: 10 },
    { name: 'afterImages', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
  ])(req, res, async (err) => {
    if (err) {
      console.error('Upload error in update:', err);
      const project = await Project.findById(req.params.id);
      return res.status(400).render('projects/edit', {
        project,
        error: 'خطأ في رفع الملفات: ' + err.message,
        title: 'تعديل المشروع'
      });
    }

    try {
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).render('error', { error: 'المشروع غير موجود' });
      }

      // تحديث المعلومات الأساسية
      project.name.ar = req.body.nameAr;
      project.name.en = req.body.nameEn;
      project.location.ar = req.body.locationAr;
      project.location.en = req.body.locationEn;
      project.duration = req.body.duration;
      project.description = {
        ar: req.body.descriptionAr || '',
        en: req.body.descriptionEn || ''
      };
      project.status = req.body.status;

      // معالجة الملفات المحذوفة
      const deletedBeforeImages = req.body.deletedBeforeImages ? req.body.deletedBeforeImages.split(',') : [];
      const deletedAfterImages = req.body.deletedAfterImages ? req.body.deletedAfterImages.split(',') : [];
      const deletedVideos = req.body.deletedVideos ? req.body.deletedVideos.split(',') : [];

      // حذف الصور والفيديوهات من Cloudinary
      const deletePromises = [];
      
      deletedBeforeImages.forEach(id => {
        const imageToDelete = project.beforeImages.find(img => img._id.toString() === id);
        if (imageToDelete) {
          deletePromises.push(cloudinary.uploader.destroy(imageToDelete.publicId));
          project.beforeImages = project.beforeImages.filter(img => img._id.toString() !== id);
        }
      });

      deletedAfterImages.forEach(id => {
        const imageToDelete = project.afterImages.find(img => img._id.toString() === id);
        if (imageToDelete) {
          deletePromises.push(cloudinary.uploader.destroy(imageToDelete.publicId));
          project.afterImages = project.afterImages.filter(img => img._id.toString() !== id);
        }
      });

      deletedVideos.forEach(id => {
        const videoToDelete = project.videos.find(vid => vid._id.toString() === id);
        if (videoToDelete) {
          deletePromises.push(cloudinary.uploader.destroy(videoToDelete.publicId, { resource_type: 'video' }));
          project.videos = project.videos.filter(vid => vid._id.toString() !== id);
        }
      });

      await Promise.all(deletePromises);

      // إضافة الملفات الجديدة
      if (req.files.beforeImages) {
        const newBeforeImages = req.files.beforeImages.map(file => ({
          url: file.path,
          publicId: file.filename
        }));
        project.beforeImages.push(...newBeforeImages);
      }

      if (req.files.afterImages) {
        const newAfterImages = req.files.afterImages.map(file => ({
          url: file.path,
          publicId: file.filename
        }));
        project.afterImages.push(...newAfterImages);
      }

      if (req.files.videos) {
        const newVideos = req.files.videos.map((file, index) => ({
          url: file.path,
          publicId: file.filename,
          title: {
            ar: req.body[`videoTitleAr_${index}`] || `فيديو جديد ${index + 1}`,
            en: req.body[`videoTitleEn_${index}`] || `New Video ${index + 1}`
          }
        }));
        project.videos.push(...newVideos);
      }

      await project.save();
      res.redirect(`/projects/${project._id}?success=` + encodeURIComponent('تم تحديث المشروع بنجاح'));
    } catch (error) {
      console.error('Error updating project:', error);
      const project = await Project.findById(req.params.id);
      res.status(400).render('projects/edit', {
        project,
        error: 'خطأ في تحديث المشروع: ' + error.message,
        title: 'تعديل المشروع'
      });
    }
  });
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'المشروع غير موجود' });
    }

    // حذف جميع الملفات من Cloudinary
    const deletePromises = [];
    
    project.beforeImages.forEach(img => {
      deletePromises.push(cloudinary.uploader.destroy(img.publicId));
    });
    
    project.afterImages.forEach(img => {
      deletePromises.push(cloudinary.uploader.destroy(img.publicId));
    });
    
    project.videos.forEach(video => {
      deletePromises.push(cloudinary.uploader.destroy(video.publicId, { resource_type: 'video' }));
    });

    await Promise.all(deletePromises);
    await Project.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'تم حذف المشروع بنجاح' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'خطأ في حذف المشروع: ' + error.message });
  }
});

module.exports = router;