const express = require('express');
const router  = express.Router();
const { getWorkingHours, updateWorkingHours } = require('../controllers/workingHoursController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',  getWorkingHours);                        // public — needed for booking UI
router.put('/',  protect, adminOnly, updateWorkingHours); // admin only

module.exports = router;
