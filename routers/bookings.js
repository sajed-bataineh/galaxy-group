const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// عرض جميع الحجوزات في الداشبورد
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) {
      const startDate = new Date(req.query.date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // إحصائيات سريعة
    const stats = {
      total: await Booking.countDocuments(),
      pending: await Booking.countDocuments({ status: 'pending' }),
      confirmed: await Booking.countDocuments({ status: 'confirmed' }),
      completed: await Booking.countDocuments({ status: 'completed' }),
      today: await Booking.countDocuments({
        appointmentDate: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      })
    };

    res.render('bookings/index', {
      title: 'إدارة الحجوزات',
      bookings,
      stats,
      currentPage: page,
      totalPages,
      filter: req.query,
      success: req.query.success
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).render('error', { error: 'خطأ في تحميل الحجوزات' });
  }
});

// عرض تفاصيل حجز معين
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).render('error', { error: 'الحجز غير موجود' });
    }
    res.render('bookings/show', {
      title: `حجز ${booking.fullName}`,
      booking,
      success: req.query.success
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).render('error', { error: 'خطأ في تحميل الحجز' });
  }
});

// تحديث حالة الحجز
router.put('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'الحجز غير موجود' });
    }

    booking.status = status;
    if (notes) booking.notes = notes;
    await booking.save();

    res.json({ 
      success: true, 
      message: 'تم تحديث حالة الحجز بنجاح' 
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'خطأ في تحديث الحجز' });
  }
});

// حذف حجز
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'الحجز غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف الحجز بنجاح' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'خطأ في حذف الحجز' });
  }
});

module.exports = router;
