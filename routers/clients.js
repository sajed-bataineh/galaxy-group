// routers/clients.js - راوتر العملاء الكامل
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Client = require('../models/Client');

// إعداد Cloudinary للشعارات
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kitchen-clients/logos',
    allowed_formats: ['jpg', 'png', 'jpeg', 'svg', 'webp'],
    transformation: [
      { width: 300, height: 300, crop: 'limit', quality: 'auto' }
    ]
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. استخدم: JPG, PNG, SVG, WEBP'), false);
    }
  }
});

// Get all clients
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find().populate('projects').sort({ createdAt: -1 });
    res.render('clients/index', { 
      clients, 
      title: 'إدارة العملاء',
      success: req.query.success 
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).render('error', { error: 'خطأ في تحميل العملاء' });
  }
});

// Show create client form
router.get('/create', (req, res) => {
  res.render('clients/create', { title: 'إضافة عميل جديد' });
});

// Create new client
router.post('/create', (req, res) => {
  upload.single('logo')(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      let errorMessage = 'خطأ في رفع الشعار';
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        errorMessage = 'حجم الشعار كبير جداً. الحد الأقصى 5 ميجابايت';
      } else if (err.message.includes('نوع الملف غير مدعوم')) {
        errorMessage = err.message;
      }
      
      return res.status(400).render('clients/create', {
        error: errorMessage,
        title: 'إضافة عميل جديد'
      });
    }

    try {
      console.log('Creating client with data:', req.body);
      console.log('Logo file:', req.file);

      const clientData = {
        name: {
          ar: req.body.nameAr,
          en: req.body.nameEn
        },
        email: req.body.email,
        phone: req.body.phone,
        company: {
          ar: req.body.companyAr || '',
          en: req.body.companyEn || ''
        },
        address: {
          ar: req.body.addressAr || '',
          en: req.body.addressEn || ''
        },
        notes: {
          ar: req.body.notesAr || '',
          en: req.body.notesEn || ''
        },
        status: req.body.status || 'active'
      };

      // Handle logo upload
      if (req.file) {
        clientData.logo = {
          url: req.file.path,
          publicId: req.file.filename
        };
        console.log('Logo uploaded:', clientData.logo);
      }

      const client = new Client(clientData);
      await client.save();

      console.log('Client created successfully:', client._id);
      res.redirect('/clients?success=' + encodeURIComponent('تم إنشاء العميل بنجاح'));
    } catch (error) {
      console.error('Error creating client:', error);
      
      // في حالة خطأ، نحذف الشعار المرفوع
      if (req.file && req.file.filename) {
        try {
          await cloudinary.uploader.destroy(req.file.filename);
        } catch (deleteError) {
          console.error('Error deleting uploaded logo:', deleteError);
        }
      }
      
      let errorMessage = 'خطأ في إنشاء العميل';
      if (error.code === 11000) {
        if (error.keyPattern.email) {
          errorMessage = 'البريد الإلكتروني مستخدم من قبل عميل آخر';
        }
      } else {
        errorMessage = 'خطأ في إنشاء العميل: ' + error.message;
      }
      
      res.status(400).render('clients/create', {
        error: errorMessage,
        title: 'إضافة عميل جديد'
      });
    }
  });
});

// Show client details
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('projects');
    if (!client) {
      return res.status(404).render('error', { error: 'العميل غير موجود' });
    }
    res.render('clients/show', { 
      client, 
      title: client.name.ar,
      success: req.query.success 
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).render('error', { error: 'خطأ في تحميل بيانات العميل' });
  }
});

// Show edit client form
router.get('/:id/edit', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).render('error', { error: 'العميل غير موجود' });
    }
    res.render('clients/edit', { 
      client, 
      title: 'تعديل العميل',
      success: req.query.success 
    });
  } catch (error) {
    console.error('Error fetching client for edit:', error);
    res.status(500).render('error', { error: 'خطأ في تحميل بيانات العميل للتعديل' });
  }
});

// Update client
router.put('/:id', (req, res) => {
  upload.single('logo')(req, res, async (err) => {
    if (err) {
      console.error('Upload error in update:', err);
      const client = await Client.findById(req.params.id);
      return res.status(400).render('clients/edit', {
        client,
        error: 'خطأ في رفع الشعار: ' + err.message,
        title: 'تعديل العميل'
      });
    }

    try {
      const client = await Client.findById(req.params.id);
      if (!client) {
        return res.status(404).render('error', { error: 'العميل غير موجود' });
      }

      // تحديث المعلومات الأساسية
      client.name.ar = req.body.nameAr;
      client.name.en = req.body.nameEn;
      client.email = req.body.email;
      client.phone = req.body.phone;
      client.company.ar = req.body.companyAr || '';
      client.company.en = req.body.companyEn || '';
      client.address.ar = req.body.addressAr || '';
      client.address.en = req.body.addressEn || '';
      client.notes.ar = req.body.notesAr || '';
      client.notes.en = req.body.notesEn || '';
      client.status = req.body.status;

      // معالجة الشعار الجديد
      if (req.file) {
        // حذف الشعار القديم من Cloudinary
        if (client.logo && client.logo.publicId) {
          try {
            await cloudinary.uploader.destroy(client.logo.publicId);
          } catch (deleteError) {
            console.error('Error deleting old logo:', deleteError);
          }
        }
        
        client.logo = {
          url: req.file.path,
          publicId: req.file.filename
        };
      }

      await client.save();
      res.redirect(`/clients/${client._id}?success=` + encodeURIComponent('تم تحديث العميل بنجاح'));
    } catch (error) {
      console.error('Error updating client:', error);
      const client = await Client.findById(req.params.id);
      
      let errorMessage = 'خطأ في تحديث العميل';
      if (error.code === 11000) {
        if (error.keyPattern.email) {
          errorMessage = 'البريد الإلكتروني مستخدم من قبل عميل آخر';
        }
      } else {
        errorMessage = 'خطأ في تحديث العميل: ' + error.message;
      }
      
      res.status(400).render('clients/edit', {
        client,
        error: errorMessage,
        title: 'تعديل العميل'
      });
    }
  });
});

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    // حذف الشعار من Cloudinary
    if (client.logo && client.logo.publicId) {
      try {
        await cloudinary.uploader.destroy(client.logo.publicId);
      } catch (deleteError) {
        console.error('Error deleting logo from Cloudinary:', deleteError);
      }
    }

    await Client.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم حذف العميل بنجاح' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'خطأ في حذف العميل: ' + error.message });
  }
});

module.exports = router;