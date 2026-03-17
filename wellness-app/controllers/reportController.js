const reportService = require('../services/reportService');
const { generatePDF } = require('../utils/pdfGenerator');
const { generateExcel } = require('../utils/excelGenerator');

/**
 * Get customer report
 * @route GET /api/reports/customer
 * @access Private (Customer)
 */
const getCustomerReport = async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const reportData = await reportService.getCustomerReport(userId);

    res.json({
      success: true,
      message: 'Customer report generated successfully',
      data: reportData
    });
  } catch (error) {
    console.error('Error in getCustomerReport controller:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate customer report'
    });
  }
};

/**
 * Get business report
 * @route GET /api/reports/business
 * @access Private (Business)
 */
const getBusinessReport = async (req, res) => {
  try {
    const businessId = req.query.businessId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: 'Business ID is required'
      });
    }

    const reportData = await reportService.getBusinessReport(businessId);

    res.json({
      success: true,
      message: 'Business report generated successfully',
      data: reportData
    });
  } catch (error) {
    console.error('Error in getBusinessReport controller:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate business report'
    });
  }
};

/**
 * Get therapist report
 * @route GET /api/reports/therapist
 * @access Private (Therapist)
 */
const getTherapistReport = async (req, res) => {
  try {
    const therapistId = req.query.therapistId;

    if (!therapistId) {
      return res.status(400).json({
        success: false,
        error: 'Therapist ID is required'
      });
    }

    const reportData = await reportService.getTherapistReport(therapistId);

    res.json({
      success: true,
      message: 'Therapist report generated successfully',
      data: reportData
    });
  } catch (error) {
    console.error('Error in getTherapistReport controller:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate therapist report'
    });
  }
};

/**
 * Generate PDF report
 * @route GET /api/reports/:type/pdf
 * @access Private
 */
const generatePDFReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { userId, businessId, therapistId } = req.query;

    let reportData;
    let title;

    // Get report data based on type
    if (type === 'customer') {
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required for customer report'
        });
      }
      reportData = await reportService.getCustomerReport(userId);
      title = 'Customer Report';
    } else if (type === 'business') {
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: 'Business ID is required for business report'
        });
      }
      reportData = await reportService.getBusinessReport(businessId);
      title = 'Business Report';
    } else if (type === 'therapist') {
      if (!therapistId) {
        return res.status(400).json({
          success: false,
          error: 'Therapist ID is required for therapist report'
        });
      }
      reportData = await reportService.getTherapistReport(therapistId);
      title = 'Therapist Report';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid report type. Must be customer, business, or therapist'
      });
    }

    // Generate PDF
    const pdfBuffer = await generatePDF(reportData, type, title);

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type.toLowerCase()}_report_${Date.now()}.pdf"`);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error in generatePDFReport controller:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate PDF report'
    });
  }
};

/**
 * Generate Excel report
 * @route GET /api/reports/:type/excel
 * @access Private
 */
const generateExcelReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { userId, businessId, therapistId } = req.query;

    let reportData;

    // Get report data based on type
    if (type === 'customer') {
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required for customer report'
        });
      }
      reportData = await reportService.getCustomerReport(userId);
    } else if (type === 'business') {
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: 'Business ID is required for business report'
        });
      }
      reportData = await reportService.getBusinessReport(businessId);
    } else if (type === 'therapist') {
      if (!therapistId) {
        return res.status(400).json({
          success: false,
          error: 'Therapist ID is required for therapist report'
        });
      }
      reportData = await reportService.getTherapistReport(therapistId);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid report type. Must be customer, business, or therapist'
      });
    }

    // Generate Excel
    const excelBuffer = await generateExcel(reportData, type);

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${type.toLowerCase()}_report_${Date.now()}.xlsx"`);

    res.send(excelBuffer);
  } catch (error) {
    console.error('Error in generateExcelReport controller:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate Excel report'
    });
  }
};

module.exports = {
  getCustomerReport,
  getBusinessReport,
  getTherapistReport,
  generatePDFReport,
  generateExcelReport
};
