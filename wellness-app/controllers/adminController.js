const UserModel = require('../models/User.js');

/**
 * Get reward system statistics for admin
 * @route GET /api/admin/reward-stats
 * @access Private (Admin)
 */
const getRewardStats = async (req, res) => {
  try {
    // Get total rewards issued (count of REVIEW_REWARD entries)
    const totalRewardsIssued = await UserModel.aggregate([
      { $unwind: '$rewardHistory' },
      { $match: { 'rewardHistory.type': 'REVIEW_REWARD' } },
      { $group: { _id: null, total: { $sum: '$rewardHistory.points' } } }
    ]);

    // Get total discounts used (count of DISCOUNT_USED entries)
    const totalDiscountsUsed = await UserModel.aggregate([
      { $unwind: '$rewardHistory' },
      { $match: { 'rewardHistory.type': 'DISCOUNT_USED' } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);

    // Get top customers by reward points
    const topCustomers = await UserModel.find()
      .select('name email rewardPoints')
      .sort({ rewardPoints: -1 })
      .limit(10);

    // Get customers with unlocked discounts
    const customersWithDiscount = await UserModel.countDocuments({
      rewardPoints: { $gte: 100 }
    });

    // Get average reward points across all customers
    const avgRewardPoints = await UserModel.aggregate([
      {
        $group: {
          _id: null,
          average: { $avg: '$rewardPoints' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalRewardsIssued: totalRewardsIssued[0]?.total || 0,
        totalDiscountsUsed: totalDiscountsUsed[0]?.count || 0,
        customersWithUnlockedDiscount: customersWithDiscount,
        averageRewardPoints: avgRewardPoints[0]?.average?.toFixed(2) || 0,
        topCustomers: topCustomers.map(customer => ({
          id: customer._id,
          name: customer.name,
          email: customer.email,
          rewardPoints: customer.rewardPoints
        }))
      }
    });

  } catch (error) {
    console.error('Error in getRewardStats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reward statistics'
    });
  }
};

module.exports = {
  getRewardStats
};
