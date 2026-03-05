const express = require('express');
const router = express.Router();
const { createBooking, getCustomerBookings } = require('../controllers/bookingController');

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking with optional reward discount
 * @access  Private (Customer)
 */
router.post('/', createBooking);

/**
 * @route   GET /api/bookings/customer/:customerId
 * @desc    Get all bookings for a specific customer
 * @access  Private
 */
router.get('/customer/:customerId', getCustomerBookings);

module.exports = router;
