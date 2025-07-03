// models/Booking.js - نموذج حجز الاستشارات
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// فهرسة للبحث السريع
bookingSchema.index({ email: 1 });
bookingSchema.index({ appointmentDate: 1 });
bookingSchema.index({ status: 1 });

// تحديث وقت التعديل تلقائياً
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// حساب الاسم الكامل
bookingSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Booking', bookingSchema);
