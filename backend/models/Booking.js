const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    comment: 'Linked customer account',
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  customerPhone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  }],
  date: {
    type: String,
    required: [true, 'Booking date is required'],
    comment: 'Format: YYYY-MM-DD',
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    comment: 'Format: HH:mm',
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    comment: 'Format: HH:mm',
  },
  totalDuration: {
    type: Number,
    required: true,
    comment: 'Total duration in minutes',
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'completed', 'cancelled'],
    default: 'confirmed',
  },
  cancellationReason: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Ensure no overlapping bookings on same date
bookingSchema.index({ date: 1, startTime: 1 });
bookingSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
