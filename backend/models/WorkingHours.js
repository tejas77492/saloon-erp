const mongoose = require('mongoose');

const workingHoursSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
    unique: true,
    comment: '0=Sunday, 1=Monday, ..., 6=Saturday',
  },
  openTime: {
    type: String,
    default: '10:00',
    comment: 'Format: HH:mm',
  },
  closeTime: {
    type: String,
    default: '20:00',
    comment: 'Format: HH:mm',
  },
  isClosed: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('WorkingHours', workingHoursSchema);
