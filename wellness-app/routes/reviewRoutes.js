const express = require('express');
const router = express.Router();
const { submitReview, getServiceReviews, getCustomerReviews } = require('../controllers/reviewController');

/**
 * @route   POST /api/reviews
 * @desc    Submit a review and earn reward points
 * @access  Private (Customer)
 */
router.post('/', submitReview);

/**
 * @route   GET /api/reviews/service/:serviceId
 * @desc    Get all reviews for a specific service
 * @access  Public
 */
router.get('/service/:serviceId', getServiceReviews);

/**
 * @route   GET /api/reviews/customer/:customerId
 * @desc    Get all reviews by a specific customer
 * @access  Private
 */
router.get('/customer/:customerId', getCustomerReviews);

module.exports = router;
