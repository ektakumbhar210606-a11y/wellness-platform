const ReviewModel = require('../models/Review');
const UserModel = require('../models/User');
const { REWARD_POINTS_PER_REVIEW, calculateUpdatedPoints, createRewardHistoryEntry } = require('../utils/rewardUtils');

/**
 * Submit a review and award reward points
 * @route POST /api/reviews
 * @access Private (Customer)
 */
const submitReview = async (req, res) => {
  try {
    const { customerId, serviceId, rating, comment } = req.body;

    // Input validation
    if (!customerId || !serviceId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID, Service ID, and Rating are required'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Check for duplicate review
    const existingReview = await ReviewModel.findOne({
      customerId,
      serviceId
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        error: 'You have already reviewed this service'
      });
    }

    // Create and save review
    const review = new ReviewModel({
      customerId,
      serviceId,
      rating,
      comment
    });

    await review.save();

    // Award reward points to customer
    const customer = await UserModel.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const currentPoints = customer.rewardPoints || 0;
    const newPoints = calculateUpdatedPoints(currentPoints);
    const pointsEarned = newPoints - currentPoints;

    // Add reward history entry
    const rewardEntry = createRewardHistoryEntry(
      'REVIEW_REWARD',
      pointsEarned,
      `Reward for submitting review`
    );

    customer.rewardPoints = newPoints;
    customer.rewardHistory.push(rewardEntry);
    
    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and reward points awarded',
      data: {
        review: {
          id: review._id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt
        },
        rewardPoints: {
          previous: currentPoints,
          earned: pointsEarned,
          total: newPoints
        }
      }
    });

  } catch (error) {
    console.error('Error in submitReview:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit review'
    });
  }
};

/**
 * Get reviews for a specific service
 * @route GET /api/reviews/service/:serviceId
 * @access Public
 */
const getServiceReviews = async (req, res) => {
  try {
    const { serviceId } = req.params;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        error: 'Service ID is required'
      });
    }

    const reviews = await ReviewModel.find({ serviceId })
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });

  } catch (error) {
    console.error('Error in getServiceReviews:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reviews'
    });
  }
};

/**
 * Get reviews by a specific customer
 * @route GET /api/reviews/customer/:customerId
 * @access Private
 */
const getCustomerReviews = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const reviews = await ReviewModel.find({ customerId })
      .populate('serviceId', 'name price')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });

  } catch (error) {
    console.error('Error in getCustomerReviews:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch customer reviews'
    });
  }
};

module.exports = {
  submitReview,
  getServiceReviews,
  getCustomerReviews
};
