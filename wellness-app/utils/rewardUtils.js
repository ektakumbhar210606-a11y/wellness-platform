/**
 * Reward System Utility Functions
 * Handles reward points calculation and discount validation
 */

const REWARD_POINTS_PER_REVIEW = 5;
const MAX_REWARD_POINTS = 100;
const DISCOUNT_PERCENTAGE = 0.10; // 10%

/**
 * Check if customer qualifies for discount
 * @param {Object} customer - Customer document
 * @returns {boolean} - True if discount is unlocked
 */
const checkRewardDiscount = (customer) => {
  return customer.rewardPoints >= MAX_REWARD_POINTS;
};

/**
 * Calculate reward points to add (ensures max limit)
 * @param {number} currentPoints - Current reward points
 * @param {number} pointsToAdd - Points to add
 * @returns {number} - New total points (capped at max)
 */
const calculateUpdatedPoints = (currentPoints, pointsToAdd = REWARD_POINTS_PER_REVIEW) => {
  return Math.min(currentPoints + pointsToAdd, MAX_REWARD_POINTS);
};

/**
 * Calculate discounted price
 * @param {number} originalPrice - Original service price
 * @returns {object} - Object with discount amount and final price
 */
const calculateDiscountedPrice = (originalPrice) => {
  const discount = originalPrice * DISCOUNT_PERCENTAGE;
  const finalPrice = originalPrice - discount;
  
  return {
    discount: Math.round(discount * 100) / 100, // Round to 2 decimal places
    finalPrice: Math.round(finalPrice * 100) / 100
  };
};

/**
 * Create reward history entry
 * @param {string} type - Type of reward (REVIEW_REWARD or DISCOUNT_USED)
 * @param {number} points - Points associated with this entry
 * @param {string} description - Description of the reward action
 * @returns {object} - Reward history entry object
 */
const createRewardHistoryEntry = (type, points, description) => {
  return {
    type,
    points,
    description,
    date: new Date()
  };
};

module.exports = {
  REWARD_POINTS_PER_REVIEW,
  MAX_REWARD_POINTS,
  DISCOUNT_PERCENTAGE,
  checkRewardDiscount,
  calculateUpdatedPoints,
  calculateDiscountedPrice,
  createRewardHistoryEntry
};
