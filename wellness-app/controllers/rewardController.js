const UserModel = require('../models/User.js');
const { checkRewardDiscount, MAX_REWARD_POINTS } = require('../utils/rewardUtils');

/**
 * Get customer reward information
 * @route GET /api/customer/rewards
 * @access Private (Customer)
 */
const getCustomerRewards = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const customer = await UserModel.findById(customerId).select('rewardPoints rewardHistory name email');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const discountUnlocked = checkRewardDiscount(customer);
    const pointsRemaining = MAX_REWARD_POINTS - customer.rewardPoints;

    res.json({
      success: true,
      data: {
        customerId: customer._id,
        customerName: customer.name,
        rewardPoints: customer.rewardPoints,
        maxPoints: MAX_REWARD_POINTS,
        discountUnlocked,
        pointsRemaining,
        rewardHistory: customer.rewardHistory || []
      }
    });

  } catch (error) {
    console.error('Error in getCustomerRewards:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reward information'
    });
  }
};

/**
 * Get reward history for a customer
 * @route GET /api/customer/rewards/history/:customerId
 * @access Private
 */
const getRewardHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const customer = await UserModel.findById(customerId)
      .select('rewardHistory')
      .sort({ 'rewardHistory.date': -1 });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      count: customer.rewardHistory ? customer.rewardHistory.length : 0,
      data: customer.rewardHistory || []
    });

  } catch (error) {
    console.error('Error in getRewardHistory:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reward history'
    });
  }
};

module.exports = {
  getCustomerRewards,
  getRewardHistory
};
