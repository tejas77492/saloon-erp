const express = require('express');
const router  = express.Router();
const { createBooking, getBookings, getBooking, getMyBookings, updateBooking, deleteBooking, getStats } = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');

// Customer routes
router.post('/',     protect, createBooking);           // customer creates booking (must be logged in)
router.get('/my',    protect, getMyBookings);            // customer sees own bookings

// Admin routes
router.get('/stats', protect, adminOnly, getStats);
router.get('/',      protect, adminOnly, getBookings);
router.get('/:id',   protect, adminOnly, getBooking);
router.put('/:id',   protect, adminOnly, updateBooking);
router.delete('/:id',protect, adminOnly, deleteBooking);

module.exports = router;
