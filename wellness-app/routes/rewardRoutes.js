const express = require('express');
const router = express.Router();
const { getCustomerRewards, getRewardHistory } = require('../controllers/rewardController');

/**
 * @route   GET /api/customer/rewards/:customerId
 * @desc    Get customer reward information
 * @access  Private (Customer)
 */
router.get('/rewards/:customerId', getCustomerRewards);

/**
 * @route   GET /api/customer/rewards/history/:customerId
 * @desc    Get customer reward history
 * @access  Private
 */
router.get('/rewards/history/:customerId', getRewardHistory);

module.exports = router;
