const mongoose = require('mongoose');

const blockedTimeSchema = new mongoose.Schema({
  date: {
    type: String,
    comment: 'Format: YYYY-MM-DD. Null if recurring.',
  },
  startTime: {
    type: String,
    comment: 'Format: HH:mm. Null if full day.',
  },
  endTime: {
    type: String,
    comment: 'Format: HH:mm. Null if full day.',
  },
  reason: {
    type: String,
    trim: true,
    default: '',
  },
  isFullDay: {
    type: Boolean,
    default: false,
  },
  recurring: {
    enabled: { type: Boolean, default: false },
    days: [{ type: Number, min: 0, max: 6 }], // 0=Sun, 1=Mon, ..., 6=Sat
  },
}, { timestamps: true });

module.exports = mongoose.model('BlockedTime', blockedTimeSchema);
