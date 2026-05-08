const express = require('express');
const router  = express.Router();
const { getAvailability } = require('../controllers/availabilityController');

router.get('/', getAvailability);  // public

module.exports = router;
