
// routers/contacts.js - راوتر رسائل التواصل
const express = require('express');
const router = express.Router();
const Contact = require('../models/contact');

// عرض جميع الرسائل في الداشبورد
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Contact.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // إحصائيات سريعة
    const stats = {
      total: await Contact.countDocuments(),
      new: await Contact.countDocuments({ status: 'new' }),
      read: await Contact.countDocuments({ status: 'read' }),
      replied: await Contact.countDocuments({ status: 'replied' }),
      high: await Contact.countDocuments({ priority: 'high' })
    };

    res.render('contacts/index', {
      title: 'إدارة الرسائل',
      contacts,
      stats,
      currentPage: page,
      totalPages,
      filter: req.query,
      success: req.query.success
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).render('error', { error: 'خطأ في تحميل الرسائل' });
  }
});

// عرض تفاصيل رسالة معينة
router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).render('error', { error: 'الرسالة غير موجودة' });
    }

    // تحديث حالة الرسالة إلى "مقروءة" تلقائياً
    if (contact.status === 'new') {
      contact.status = 'read';
      await contact.save();
    }

    res.render('contacts/show', {
      title: `رسالة من ${contact.fullName}`,
      contact,
      success: req.query.success
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).render('error', { error: 'خطأ في تحميل الرسالة' });
  }
});

// تحديث حالة الرسالة
router.put('/:id/status', async (req, res) => {
  try {
    const { status, priority, adminNotes } = req.body;
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ error: 'الرسالة غير موجودة' });
    }

    contact.status = status;
    if (priority) contact.priority = priority;
    if (adminNotes) contact.adminNotes = adminNotes;
    if (status === 'replied') contact.repliedAt = new Date();
    
    await contact.save();

    res.json({ 
      success: true, 
      message: 'تم تحديث حالة الرسالة بنجاح' 
    });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({ error: 'خطأ في تحديث الرسالة' });
  }
});

// حذف رسالة
router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'الرسالة غير موجودة' });
    }
    res.json({ success: true, message: 'تم حذف الرسالة بنجاح' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'خطأ في حذف الرسالة' });
  }
});

module.exports = router;
