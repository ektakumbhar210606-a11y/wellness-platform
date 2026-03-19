const ExcelJS = require('exceljs');
const moment = require('moment');

/**
 * Generate Excel report
 * @param {object} data - Report data
 * @param {string} type - Report type (customer, business, therapist)
 * @returns {Promise<Buffer>} Excel buffer
 */
const generateExcel = async (data, type) => {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Wellness Platform';
    workbook.created = new Date();

    // Generate based on type
    if (type === 'customer') {
      await generateCustomerExcel(workbook, data);
    } else if (type === 'business') {
      await generateBusinessExcel(workbook, data);
    } else if (type === 'therapist') {
      await generateTherapistExcel(workbook, data);
    }

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw error;
  }
};

/**
 * Generate customer Excel report
 */
const generateCustomerExcel = async (workbook, data) => {
  // Sheet 1: Overview
  const overviewSheet = workbook.addWorksheet('Overview');
  
  // Title
  overviewSheet.getCell('A1').value = 'Customer Report';
  overviewSheet.getCell('A1').font = { bold: true, size: 16 };
  overviewSheet.getCell('A2').value = `Generated: ${moment().format('MMMM DD, YYYY HH:mm:ss')}`;
  
  // Stats
  const stats = [
    ['Total Bookings', data.totalBookings],
    ['Completed Bookings', data.completedBookings],
    ['Cancelled Bookings', data.cancelledBookings],
    ['Total Spent (₹)', data.totalSpent],
    ['Total Discount Used (₹)', data.totalDiscountUsed],
    ['Most Booked Service', data.mostBookedService || 'N/A']
  ];

  overviewSheet.addRows(stats);
  
  // Format columns
  overviewSheet.getColumn(1).width = 30;
  overviewSheet.getColumn(2).width = 20;

  // Sheet 2: Recent Bookings
  const bookingsSheet = workbook.addWorksheet('Recent Bookings');
  
  // Headers
  bookingsSheet.addRow(['Service', 'Therapist', 'Date', 'Time', 'Status', 'Price (₹)', 'Discount Applied']);
  bookingsSheet.getRow(1).font = { bold: true };
  bookingsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDDDDDD' }
  };

  // Data rows
  if (data.recentBookings && data.recentBookings.length > 0) {
    data.recentBookings.forEach(booking => {
      bookingsSheet.addRow([
        booking.serviceName,
        booking.therapistName,
        moment(booking.date).format('MMM DD, YYYY'),
        booking.time,
        booking.status,
        booking.finalPrice,
        booking.discountApplied ? 'Yes' : 'No'
      ]);
    });
  }

  // Auto-width columns
  bookingsSheet.columns.forEach(column => {
    column.width = 20;
  });
};

/**
 * Generate business Excel report
 */
const generateBusinessExcel = async (workbook, data) => {
  // Check if we have selectedFields array or direct data
  const reportData = data.selectedFields || data;
  
  // Sheet 1: Overview
  const overviewSheet = workbook.addWorksheet('Overview');
  
  overviewSheet.getCell('A1').value = 'Business Report';
  overviewSheet.getCell('A1').font = { bold: true, size: 16 };
  overviewSheet.getCell('A2').value = `Generated: ${moment().format('MMMM DD, YYYY HH:mm:ss')}`;
  
  const stats = [];
  
  // Add stats based on what fields are present in the data
  if (reportData.totalServices !== undefined) {
    stats.push(['Total Services', reportData.totalServices]);
  }
  if (reportData.totalTherapists !== undefined) {
    stats.push(['Total Therapists', reportData.totalTherapists]);
  }
  if (reportData.totalBookings !== undefined) {
    stats.push(['Total Bookings', reportData.totalBookings]);
  }
  if (reportData.completedBookings !== undefined) {
    stats.push(['Completed Bookings', reportData.completedBookings]);
  }
  if (reportData.cancelledBookings !== undefined) {
    stats.push(['Cancelled Bookings', reportData.cancelledBookings]);
  }
  if (reportData.totalRevenue !== undefined) {
    stats.push(['Total Revenue (₹)', reportData.totalRevenue]);
  }
  if (reportData.mostBookedService !== undefined) {
    stats.push(['Most Booked Service', reportData.mostBookedService || 'N/A']);
  }
  if (reportData.topTherapist !== undefined) {
    stats.push(['Top Therapist', reportData.topTherapist?.name || 'N/A']);
    stats.push(['Top Therapist Bookings', reportData.topTherapist?.bookings || 0]);
  }

  overviewSheet.addRows(stats);
  overviewSheet.getColumn(1).width = 30;
  overviewSheet.getColumn(2).width = 20;

  // Sheet 2: Monthly Revenue (if data is available)
  if (reportData.monthlyRevenue && reportData.monthlyRevenue.length > 0) {
    const revenueSheet = workbook.addWorksheet('Monthly Revenue');
    
    revenueSheet.addRow(['Month', 'Revenue (₹)']);
    revenueSheet.getRow(1).font = { bold: true };
    revenueSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDDDDD' }
    };

    reportData.monthlyRevenue.forEach(month => {
      revenueSheet.addRow([
        moment(month.month).format('MMMM YYYY'),
        month.revenue
      ]);
    });

    revenueSheet.columns.forEach(column => {
      column.width = 25;
    });
  }
};

/**
 * Generate therapist Excel report
 */
const generateTherapistExcel = async (workbook, data) => {
  // Sheet 1: Overview
  const overviewSheet = workbook.addWorksheet('Overview');
  
  overviewSheet.getCell('A1').value = 'Therapist Report';
  overviewSheet.getCell('A1').font = { bold: true, size: 16 };
  overviewSheet.getCell('A2').value = `Generated: ${moment().format('MMMM DD, YYYY HH:mm:ss')}`;
  
  const stats = [
    ['Total Bookings', data.totalBookings],
    ['Completed Bookings', data.completedBookings],
    ['Cancelled Bookings', data.cancelledBookings],
    ['Total Earnings (₹)', data.totalEarnings],
    ['Services Performed', data.totalServicesDone],
    ['Monthly Cancellations', data.monthlyCancelCount],
    ['Bonus/Penalty (%)', `${data.bonusPenaltyPercentage >= 0 ? '+' : ''}${data.bonusPenaltyPercentage}%`]
  ];

  overviewSheet.addRows(stats);
  overviewSheet.getColumn(1).width = 30;
  overviewSheet.getColumn(2).width = 20;

  // Sheet 2: Recent Bookings
  const bookingsSheet = workbook.addWorksheet('Recent Bookings');
  
  bookingsSheet.addRow(['Service', 'Customer', 'Date', 'Time', 'Status', 'Earnings (₹)']);
  bookingsSheet.getRow(1).font = { bold: true };
  bookingsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDDDDDD' }
  };

  if (data.recentBookings && data.recentBookings.length > 0) {
    data.recentBookings.forEach(booking => {
      bookingsSheet.addRow([
        booking.serviceName,
        booking.customerName,
        moment(booking.date).format('MMM DD, YYYY'),
        booking.time,
        booking.status,
        booking.earnings
      ]);
    });
  }

  bookingsSheet.columns.forEach(column => {
    column.width = 20;
  });
};

module.exports = {
  generateExcel
};
