const express = require('express');
const router = express.Router();
const { getRewardStats } = require('../controllers/adminController');

/**
 * @route   GET /api/admin/reward-stats
 * @desc    Get reward system statistics
 * @access  Private (Admin)
 */
router.get('/reward-stats', getRewardStats);

module.exports = router;
