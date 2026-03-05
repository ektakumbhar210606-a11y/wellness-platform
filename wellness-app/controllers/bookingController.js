const BookingModel = require('../models/Booking');
const UserModel = require('../models/User');
const ServiceModel = require('../models/Service'); // Assuming Service model exists
const { checkRewardDiscount, calculateDiscountedPrice, createRewardHistoryEntry } = require('../utils/rewardUtils');

/**
 * Create a new booking with optional reward discount
 * @route POST /api/bookings
 * @access Private (Customer)
 */
const createBooking = async (req, res) => {
  try {
    const { customerId, serviceId, bookingDate } = req.body;

    // Input validation
    if (!customerId || !serviceId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID and Service ID are required'
      });
    }

    // Fetch service to get price
    const service = await ServiceModel.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    const servicePrice = service.price || 0;

    // Fetch customer to check reward eligibility
    const customer = await UserModel.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Check if customer qualifies for reward discount
    const isDiscountEligible = checkRewardDiscount(customer);
    
    let originalPrice = servicePrice;
    let discountApplied = 0;
    let finalPrice = servicePrice;

    // Apply discount if eligible
    if (isDiscountEligible) {
      const discountCalculation = calculateDiscountedPrice(servicePrice);
      discountApplied = discountCalculation.discount;
      finalPrice = discountCalculation.finalPrice;

      // Reset reward points after using discount
      customer.rewardPoints = 0;
      
      // Add reward history entry for discount usage
      const discountEntry = createRewardHistoryEntry(
        'DISCOUNT_USED',
        -100,
        '10% reward discount used'
      );
      customer.rewardHistory.push(discountEntry);
      
      await customer.save();
    }

    // Create booking
    const booking = new BookingModel({
      customerId,
      serviceId,
      originalPrice,
      discountApplied,
      finalPrice,
      bookingDate: bookingDate || new Date()
    });

    await booking.save();

    // Populate service and customer details for response
    const populatedBooking = await BookingModel.findById(booking._id)
      .populate('serviceId', 'name price')
      .populate('customerId', 'name email');

    res.status(201).json({
      success: true,
      message: isDiscountEligible 
        ? 'Booking created successfully with 10% reward discount!' 
        : 'Booking created successfully',
      data: {
        booking: {
          id: populatedBooking._id,
          customer: populatedBooking.customerId.name,
          service: populatedBooking.serviceId.name,
          bookingDate: populatedBooking.bookingDate
        },
        pricing: {
          originalPrice: `₹${originalPrice.toFixed(2)}`,
          discountApplied: isDiscountEligible ? `-₹${discountApplied.toFixed(2)}` : '₹0.00',
          finalPrice: `₹${finalPrice.toFixed(2)}`,
          discountPercentage: isDiscountEligible ? '10%' : '0%'
        },
        rewardStatus: {
          discountUsed: isDiscountEligible,
          previousPoints: isDiscountEligible ? 100 : customer.rewardPoints,
          currentPoints: customer.rewardPoints,
          message: isDiscountEligible 
            ? 'Reward points reset to 0 after discount usage' 
            : `Current points: ${customer.rewardPoints}/100`
        }
      }
    });

  } catch (error) {
    console.error('Error in createBooking:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create booking'
    });
  }
};

/**
 * Get bookings for a specific customer
 * @route GET /api/bookings/customer/:customerId
 * @access Private
 */
const getCustomerBookings = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const bookings = await BookingModel.find({ customerId })
      .populate('serviceId', 'name price')
      .sort({ bookingDate: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    console.error('Error in getCustomerBookings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch customer bookings'
    });
  }
};

module.exports = {
  createBooking,
  getCustomerBookings
};
