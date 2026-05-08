const express = require('express');
const router  = express.Router();
const { getServices, getService, createService, updateService, deleteService } = require('../controllers/serviceController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',      getServices);
router.get('/:id',   getService);
router.post('/',     protect, adminOnly, createService);
router.put('/:id',   protect, adminOnly, updateService);
router.delete('/:id',protect, adminOnly, deleteService);

module.exports = router;
