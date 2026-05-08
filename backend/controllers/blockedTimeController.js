const BlockedTime  = require('../models/BlockedTime');
const Booking      = require('../models/Booking');
const Notification = require('../models/Notification');
const { timeToMinutes } = require('../utils/slotEngine');

// GET /api/blocked-time
exports.getBlockedTimes = async (req, res) => {
  try {
    const blocks = await BlockedTime.find().sort({ createdAt: -1 });
    res.json({ success: true, data: blocks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/blocked-time
// When blocking time, auto-cancel any overlapping confirmed bookings and notify customers
exports.createBlockedTime = async (req, res) => {
  try {
    const block = await BlockedTime.create(req.body);

    // Find and auto-cancel overlapping bookings
    let cancelledCount = 0;

    if (block.date) {
      // One-time block on specific date
      let query = { date: block.date, status: 'confirmed' };

      if (!block.isFullDay && block.startTime && block.endTime) {
        // Time-range block — find overlapping bookings
        query.$or = [
          { startTime: { $lt: block.endTime }, endTime: { $gt: block.startTime } },
        ];
      }
      // Full-day block — cancel all bookings on that date

      const overlapping = await Booking.find(query).populate('services', 'name');
      for (const booking of overlapping) {
        booking.status = 'cancelled';
        booking.cancellationReason = `Shop ${block.isFullDay ? 'closed' : 'blocked'}: ${block.reason || 'Admin blocked this time'}`;
        await booking.save();
        cancelledCount++;

        // Notify customer
        if (booking.user) {
          await Notification.create({
            user: booking.user,
            type: block.isFullDay ? 'shop_closed' : 'time_blocked',
            title: block.isFullDay ? 'Shop Closed — Booking Cancelled 🏪' : 'Time Blocked — Booking Cancelled ⏰',
            message: `Your appointment on ${booking.date} at ${booking.startTime} has been automatically cancelled. Reason: ${block.reason || 'Shop closure'}. Services: ${booking.services.map(s => s.name).join(', ')}. Please rebook for another time.`,
            booking: booking._id,
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      data: block,
      cancelledBookings: cancelledCount,
      message: cancelledCount > 0
        ? `Block created. ${cancelledCount} overlapping booking(s) were auto-cancelled and customers notified.`
        : 'Block created.',
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/blocked-time/:id
exports.deleteBlockedTime = async (req, res) => {
  try {
    await BlockedTime.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Block removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
