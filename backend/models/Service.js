const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: 5,
    comment: 'Duration in minutes',
  },
  category: {
    type: String,
    enum: ['hair', 'beard', 'skin', 'nails', 'other'],
    default: 'other',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  bufferTime: {
    type: Number,
    default: 0,
    comment: 'Cleanup buffer in minutes after service',
  },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
