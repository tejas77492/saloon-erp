const Booking      = require('../models/Booking');
const BlockedTime  = require('../models/BlockedTime');
const WorkingHours = require('../models/WorkingHours');
const { generateSlots } = require('../utils/slotEngine');

// GET /api/availability?date=YYYY-MM-DD&duration=45
exports.getAvailability = async (req, res) => {
  try {
    const { date, duration } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'date query param required.' });

    const totalDuration = parseInt(duration) || 30;
    const dayOfWeek     = new Date(date + 'T00:00:00').getDay(); // 0=Sun

    // 1. Get working hours for that day
    const wh = await WorkingHours.findOne({ day: dayOfWeek });
    if (!wh || wh.isClosed) {
      return res.json({ success: true, data: [], message: 'Salon is closed on this day.' });
    }

    // 2. Get bookings for that date (active)
    const bookings = await Booking.find({
      date,
      status: { $ne: 'cancelled' },
    }).select('startTime endTime status');

    // 3. Get blocked times for that date (one-time + recurring)
    const allBlocks   = await BlockedTime.find();
    const applicable  = allBlocks.filter(b => {
      if (b.date === date) return true;
      if (b.recurring?.enabled && b.recurring.days?.includes(dayOfWeek)) return true;
      return false;
    });

    // 4. Generate slots
    const slots = generateSlots(wh, bookings, applicable, totalDuration);

    res.json({ success: true, data: slots, date, workingHours: { open: wh.openTime, close: wh.closeTime } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
