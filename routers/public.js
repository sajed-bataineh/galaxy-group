
// routers/public.js - راوتر للصفحات العامة (استقبال البيانات من النماذج)
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Contact = require('../models/Contact');

// معالجة إرسال نموذج حجز الاستشارة
router.post('/book-consultation', async (req, res) => {
  try {
    const bookingData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      appointmentDate: req.body.appointmentDate,
      appointmentTime: req.body.appointmentTime,
      message: req.body.message || ''
    };

    const booking = new Booking(bookingData);
    await booking.save();

    // يمكنك إضافة إرسال إيميل تأكيد هنا
    console.log('New booking created:', booking._id);

    res.json({ 
      success: true, 
      message: 'تم حجز الاستشارة بنجاح! سنتواصل معك قريباً.' 
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(400).json({ 
      success: false, 
      message: 'حدث خطأ في حجز الاستشارة. يرجى المحاولة مرة أخرى.' 
    });
  }
});

// معالجة إرسال نموذج التواصل
router.post('/contact', async (req, res) => {
  try {
    const contactData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      message: req.body.message
    };

    const contact = new Contact(contactData);
    await contact.save();

    // يمكنك إضافة إرسال إيميل تنبيه هنا
    console.log('New contact message created:', contact._id);

    res.json({ 
      success: true, 
      message: 'تم إرسال رسالتك بنجاح! سنرد عليك في أقرب وقت.' 
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(400).json({ 
      success: false, 
      message: 'حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.' 
    });
  }
});

module.exports = router;