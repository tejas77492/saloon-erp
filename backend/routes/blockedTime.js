const express = require('express');
const router  = express.Router();
const { getBlockedTimes, createBlockedTime, deleteBlockedTime } = require('../controllers/blockedTimeController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',       protect, adminOnly, getBlockedTimes);
router.post('/',      protect, adminOnly, createBlockedTime);
router.delete('/:id', protect, adminOnly, deleteBlockedTime);

module.exports = router;
