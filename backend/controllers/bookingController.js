const Booking      = require('../models/Booking');
const Service      = require('../models/Service');
const Notification = require('../models/Notification');
const { timeToMinutes, minutesToTime } = require('../utils/slotEngine');

// POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, services, date, startTime, notes } = req.body;

    if (!services || services.length === 0)
      return res.status(400).json({ success: false, message: 'Select at least one service.' });

    // Fetch service details
    const serviceDetails = await Service.find({ _id: { $in: services }, isActive: true });
    if (serviceDetails.length !== services.length)
      return res.status(400).json({ success: false, message: 'One or more services are invalid.' });

    const totalDuration = serviceDetails.reduce((sum, s) => sum + s.duration + (s.bufferTime || 0), 0);
    const totalPrice    = serviceDetails.reduce((sum, s) => sum + s.price, 0);

    const startMin = timeToMinutes(startTime);
    const endMin   = startMin + totalDuration;
    const endTime  = minutesToTime(endMin);

    // Conflict check
    const conflicting = await Booking.findOne({
      date,
      status: { $ne: 'cancelled' },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
      ],
    });
    if (conflicting)
      return res.status(409).json({ success: false, message: 'Time slot is already booked.' });

    // Auto-confirm — no pending status
    const booking = await Booking.create({
      user: req.user?._id || undefined,
      customerName, customerPhone, customerEmail,
      services, date, startTime, endTime,
      totalDuration, totalPrice, notes,
      status: 'confirmed',
    });

    // Send confirmation notification to user
    if (req.user) {
      await Notification.create({
        user: req.user._id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed! ✅',
        message: `Your appointment on ${date} at ${startTime} has been confirmed. Services: ${serviceDetails.map(s => s.name).join(', ')}. Total: ₹${totalPrice}.`,
        booking: booking._id,
      });
    }

    await booking.populate('services');
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bookings  (admin)
exports.getBookings = async (req, res) => {
  try {
    const { date, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (date)   filter.date   = date;
    if (status) filter.status = status;

    const total    = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('services', 'name price duration')
      .populate('user', 'name email')
      .sort({ date: -1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: bookings, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bookings/my  (customer — own bookings)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('services', 'name price duration')
      .sort({ date: -1, startTime: -1 });
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bookings/:id
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('services').populate('user', 'name email');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/bookings/:id  (admin — cancel or mark completed)
exports.updateBooking = async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id).populate('services');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const oldStatus = booking.status;
    if (status) booking.status = status;
    if (cancellationReason) booking.cancellationReason = cancellationReason;
    await booking.save();

    // Notify customer if booking was cancelled
    if (status === 'cancelled' && booking.user) {
      await Notification.create({
        user: booking.user,
        type: 'booking_cancelled',
        title: 'Booking Cancelled ❌',
        message: `Your appointment on ${booking.date} at ${booking.startTime} has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''} Services: ${booking.services.map(s => s.name).join(', ')}.`,
        booking: booking._id,
      });
    }

    await booking.populate('user', 'name email');
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/bookings/:id
exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Booking deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bookings/stats  (dashboard analytics)
exports.getStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [todayBookings, allBookings] = await Promise.all([
      Booking.find({ date: today, status: { $ne: 'cancelled' } }).populate('services', 'name price'),
      Booking.find({ status: { $ne: 'cancelled' } }).populate('services', 'name price'),
    ]);

    const todayRevenue = todayBookings.reduce((s, b) => s + b.totalPrice, 0);
    const totalRevenue = allBookings.reduce((s, b) => s + b.totalPrice, 0);

    // Most booked services
    const serviceCount = {};
    allBookings.forEach(b => b.services.forEach(s => {
      serviceCount[s.name] = (serviceCount[s.name] || 0) + 1;
    }));
    const topServices = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Upcoming bookings (today + future, confirmed)
    const upcoming = await Booking.find({
      date: { $gte: today },
      status: 'confirmed',
    }).populate('services', 'name').populate('user', 'name').sort({ date: 1, startTime: 1 }).limit(10);

    res.json({
      success: true,
      data: {
        todayCount: todayBookings.length,
        todayRevenue,
        totalRevenue,
        totalBookings: allBookings.length,
        topServices,
        upcoming,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
