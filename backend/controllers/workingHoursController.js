const WorkingHours = require('../models/WorkingHours');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// GET /api/working-hours
exports.getWorkingHours = async (req, res) => {
  try {
    let hours = await WorkingHours.find().sort({ day: 1 });
    // Seed defaults if nothing exists
    if (hours.length === 0) {
      const defaults = DAY_NAMES.map((name, i) => ({
        day: i,
        openTime:  '10:00',
        closeTime: '20:00',
        isClosed:  i === 0, // Sunday closed by default
      }));
      hours = await WorkingHours.insertMany(defaults);
    }
    res.json({ success: true, data: hours });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/working-hours  (bulk update array)
exports.updateWorkingHours = async (req, res) => {
  try {
    const updates = req.body; // array of { day, openTime, closeTime, isClosed }
    const results = await Promise.all(
      updates.map(u =>
        WorkingHours.findOneAndUpdate(
          { day: u.day },
          { openTime: u.openTime, closeTime: u.closeTime, isClosed: u.isClosed },
          { new: true, upsert: true, runValidators: true }
        )
      )
    );
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
