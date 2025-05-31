const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    ar: { type: String, required: true },
    en: { type: String, required: true }
  },
  location: {
    ar: { type: String, required: true },
    en: { type: String, required: true }
  },
  duration: {
    type: String,
    required: true
  },
  description: {
    ar: { type: String },
    en: { type: String }
  },
  beforeImages: [{
    url: String,
    publicId: String
  }],
  afterImages: [{
    url: String,
    publicId: String
  }],
  videos: [{
    url: String,
    publicId: String,
    title: {
      ar: String,
      en: String
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'pending'],
    default: 'active'
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

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', projectSchema);