const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

/**
 * @route   GET /api/reports/customer
 * @desc    Get customer report
 * @access  Private (Customer)
 */
router.get('/customer', reportController.getCustomerReport);

/**
 * @route   GET /api/reports/business
 * @desc    Get business report
 * @access  Private (Business)
 */
router.get('/business', reportController.getBusinessReport);

/**
 * @route   GET /api/reports/therapist
 * @desc    Get therapist report
 * @access  Private (Therapist)
 */
router.get('/therapist', reportController.getTherapistReport);

/**
 * @route   GET /api/reports/:type/pdf
 * @desc    Generate PDF report
 * @access  Private
 * @params  type - customer | business | therapist
 */
router.get('/:type/pdf', reportController.generatePDFReport);

/**
 * @route   GET /api/reports/:type/excel
 * @desc    Generate Excel report
 * @access  Private
 * @params  type - customer | business | therapist
 */
router.get('/:type/excel', reportController.generateExcelReport);

module.exports = router;
