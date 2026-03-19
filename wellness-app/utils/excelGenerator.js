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
  overviewSheet.getCell('A1').value = 'Customer Booking Report';
  overviewSheet.getCell('A1').font = { bold: true, size: 16 };
  overviewSheet.getCell('A2').value = `Generated: ${moment().format('MMMM DD, YYYY HH:mm:ss')}`;
  
  // Add stats based on what fields are present in the data
  const stats = [];
  
  if (data.totalBookings !== undefined) {
    stats.push(['Total Bookings', data.totalBookings]);
  }
  if (data.completedBookings !== undefined) {
    stats.push(['Completed Bookings', data.completedBookings]);
  }
  if (data.cancelledBookings !== undefined) {
    stats.push(['Cancelled Bookings', data.cancelledBookings]);
  }
  if (data.totalSpent !== undefined) {
    stats.push(['Total Spent (₹)', data.totalSpent]);
  }
  if (data.totalDiscountUsed !== undefined) {
    stats.push(['Total Discount Used (₹)', data.totalDiscountUsed]);
  }
  if (data.mostBookedService !== undefined) {
    stats.push(['Most Booked Service', data.mostBookedService || 'N/A']);
  }

  overviewSheet.addRows(stats);
  
  // Format columns
  overviewSheet.getColumn(1).width = 30;
  overviewSheet.getColumn(2).width = 20;

  // Sheet 2: All Bookings History (if available)
  if (data.bookings && data.bookings.length > 0) {
    const bookingsSheet = workbook.addWorksheet('All Bookings');
    
    // Headers
    bookingsSheet.addRow(['Service', 'Therapist', 'Date', 'Time', 'Status', 'Price (₹)', 'Discount Applied']);
    bookingsSheet.getRow(1).font = { bold: true };
    bookingsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDDDDD' }
    };

    // Data rows
    data.bookings.forEach(booking => {
      bookingsSheet.addRow([
        booking.serviceName || 'N/A',
        booking.therapistName || 'N/A',
        moment(booking.date).format('MMM DD, YYYY'),
        booking.time || 'N/A',
        booking.status || 'pending',
        booking.finalPrice || 0,
        booking.discountApplied ? 'Yes' : 'No'
      ]);
    });

    // Auto-width columns
    bookingsSheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Add summary row
    const totalBookings = data.bookings.length;
    const totalPrice = data.bookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const completedCount = data.bookings.filter(b => b.status === 'completed').length;
    const cancelledCount = data.bookings.filter(b => b.status === 'cancelled').length;
    
    const lastRow = bookingsSheet.rowCount + 1;
    bookingsSheet.getCell(`A${lastRow}`).value = 'Summary';
    bookingsSheet.getCell(`A${lastRow}`).font = { bold: true };
    bookingsSheet.getCell(`D${lastRow}`).value = `${totalBookings} bookings`;
    bookingsSheet.getCell(`D${lastRow}`).font = { bold: true };
    bookingsSheet.getCell(`F${lastRow}`).value = totalPrice;
    bookingsSheet.getCell(`F${lastRow}`).font = { bold: true };
  }

  // Sheet 3: Monthly Booking Trend (if available)
  if (data.monthlyBookings && data.monthlyBookings.length > 0) {
    const monthlySheet = workbook.addWorksheet('Monthly Trend');
    
    // Headers
    monthlySheet.addRow(['Month', 'Bookings', 'Total Spent (₹)']);
    monthlySheet.getRow(1).font = { bold: true };
    monthlySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDDDDD' }
    };

    // Data rows
    data.monthlyBookings.forEach(item => {
      monthlySheet.addRow([
        moment(item.month + '-01').format('MMMM YYYY'),
        item.bookings,
        item.spent
      ]);
    });

    // Auto-width columns
    monthlySheet.columns.forEach(column => {
      column.width = 25;
    });
    
    // Add summary row
    const totalBookings = data.monthlyBookings.reduce((sum, item) => sum + item.bookings, 0);
    const totalSpent = data.monthlyBookings.reduce((sum, item) => sum + item.spent, 0);
    
    const lastRow = monthlySheet.rowCount + 1;
    monthlySheet.getCell(`A${lastRow}`).value = 'Total';
    monthlySheet.getCell(`A${lastRow}`).font = { bold: true };
    monthlySheet.getCell(`B${lastRow}`).value = totalBookings;
    monthlySheet.getCell(`B${lastRow}`).font = { bold: true };
    monthlySheet.getCell(`C${lastRow}`).value = totalSpent;
    monthlySheet.getCell(`C${lastRow}`).font = { bold: true };
  }

  // Sheet 4: Service History (if available)
  if (data.serviceHistory && data.serviceHistory.length > 0) {
    const serviceSheet = workbook.addWorksheet('Service History');
    
    // Headers
    serviceSheet.addRow(['Service Name', 'Times Booked', 'Total Spent (₹)', 'Last Booking']);
    serviceSheet.getRow(1).font = { bold: true };
    serviceSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDDDDD' }
    };

    // Data rows
    data.serviceHistory.forEach(item => {
      serviceSheet.addRow([
        item.serviceName || 'N/A',
        item.bookings,
        item.totalSpent,
        moment(item.lastBooking).format('MMM DD, YYYY')
      ]);
    });

    // Auto-width columns
    serviceSheet.columns.forEach(column => {
      column.width = 25;
    });
    
    // Add summary row
    const totalBookings = data.serviceHistory.reduce((sum, item) => sum + item.bookings, 0);
    const totalSpent = data.serviceHistory.reduce((sum, item) => sum + item.totalSpent, 0);
    
    const lastRow = serviceSheet.rowCount + 1;
    serviceSheet.getCell(`A${lastRow}`).value = 'Total';
    serviceSheet.getCell(`A${lastRow}`).font = { bold: true };
    serviceSheet.getCell(`B${lastRow}`).value = totalBookings;
    serviceSheet.getCell(`B${lastRow}`).font = { bold: true };
    serviceSheet.getCell(`C${lastRow}`).value = totalSpent;
    serviceSheet.getCell(`C${lastRow}`).font = { bold: true };
  }
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
  // Check if we have selectedFields array or direct data
  const reportData = data.selectedFields || data;
  
  // Sheet 1: Overview
  const overviewSheet = workbook.addWorksheet('Overview');
  
  overviewSheet.getCell('A1').value = 'Therapist Performance Report';
  overviewSheet.getCell('A1').font = { bold: true, size: 16 };
  overviewSheet.getCell('A2').value = `Generated: ${moment().format('MMMM DD, YYYY HH:mm:ss')}`;
  
  const stats = [];
  
  // Add stats based on what fields are present in the data
  if (reportData.totalBookings !== undefined) {
    stats.push(['Total Bookings', reportData.totalBookings]);
  }
  if (reportData.completedBookings !== undefined) {
    stats.push(['Completed Bookings', reportData.completedBookings]);
  }
  if (reportData.cancelledBookings !== undefined) {
    stats.push(['Cancelled Bookings', reportData.cancelledBookings]);
  }
  if (reportData.totalEarnings !== undefined) {
    stats.push(['Total Earnings (₹)', reportData.totalEarnings]);
  }
  if (reportData.totalServicesDone !== undefined) {
    stats.push(['Services Performed', reportData.totalServicesDone]);
  }
  if (reportData.monthlyCancelCount !== undefined) {
    stats.push(['Monthly Cancellations', reportData.monthlyCancelCount]);
  }
  if (reportData.bonusPenaltyPercentage !== undefined) {
    stats.push(['Bonus/Penalty (%)', `${reportData.bonusPenaltyPercentage >= 0 ? '+' : ''}${reportData.bonusPenaltyPercentage}%`]);
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

  // Sheet 3: All Bookings Details (if available)
  if (reportData.allBookingsDetails && reportData.allBookingsDetails.length > 0) {
    const allBookingsSheet = workbook.addWorksheet('All Bookings Details');
    
    allBookingsSheet.addRow(['Service', 'Customer', 'Date', 'Time', 'Status', 'Earnings (₹)']);
    allBookingsSheet.getRow(1).font = { bold: true };
    allBookingsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDDDDD' }
    };

    reportData.allBookingsDetails.forEach(booking => {
      allBookingsSheet.addRow([
        booking.serviceName,
        booking.customerName,
        moment(booking.date).format('MMM DD, YYYY'),
        booking.time || '',
        booking.status,
        booking.earnings
      ]);
    });

    allBookingsSheet.columns.forEach(column => {
      column.width = 20;
    });
  }

  // Sheet 4: Completed Bookings Details (if available)
  if (reportData.completedBookingsDetails && reportData.completedBookingsDetails.length > 0) {
    const completedSheet = workbook.addWorksheet('Completed Bookings');
    
    completedSheet.addRow(['Service', 'Customer', 'Date', 'Time', 'Earnings (₹)']);
    completedSheet.getRow(1).font = { bold: true };
    completedSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDDDDD' }
    };

    reportData.completedBookingsDetails.forEach(booking => {
      completedSheet.addRow([
        booking.serviceName,
        booking.customerName,
        moment(booking.date).format('MMM DD, YYYY'),
        booking.time || '',
        booking.earnings
      ]);
    });

    completedSheet.columns.forEach(column => {
      column.width = 20;
    });

    // Add total
    const totalEarnings = reportData.completedBookingsDetails.reduce((sum, b) => sum + (b.earnings || 0), 0);
    completedSheet.addRow(['TOTAL EARNINGS', '', '', '', totalEarnings]);
    completedSheet.getRow(completedSheet.rowCount).font = { bold: true };
  }

  // Sheet 5: Cancelled Bookings Details (if available)
  if (reportData.cancelledBookingsDetails && reportData.cancelledBookingsDetails.length > 0) {
    const cancelledSheet = workbook.addWorksheet('Cancelled Bookings');
    
    cancelledSheet.addRow(['Service', 'Customer', 'Date', 'Cancellation Reason', 'Cancelled At']);
    cancelledSheet.getRow(1).font = { bold: true };
    cancelledSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDDDDD' }
    };

    reportData.cancelledBookingsDetails.forEach(booking => {
      cancelledSheet.addRow([
        booking.serviceName,
        booking.customerName,
        moment(booking.date).format('MMM DD, YYYY'),
        booking.cancellationReason || '',
        booking.cancelledAt ? moment(booking.cancelledAt).format('MMM DD, YYYY HH:mm') : ''
      ]);
    });

    cancelledSheet.columns.forEach(column => {
      column.width = 25;
    });
  }

  // Sheet 6: Earnings Breakdown (if available)
  if (reportData.earningsDetails && reportData.earningsDetails.length > 0) {
    const earningsSheet = workbook.addWorksheet('Earnings Breakdown');
    
    earningsSheet.addRow(['Service', 'Customer', 'Date', 'Booking Price (₹)', 'Your Earnings (₹)']);
    earningsSheet.getRow(1).font = { bold: true };
    earningsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDDDDD' }
    };

    reportData.earningsDetails.forEach(item => {
      earningsSheet.addRow([
        item.serviceName,
        item.customerName,
        moment(item.date).format('MMM DD, YYYY'),
        item.bookingPrice,
        item.earnings
      ]);
    });

    earningsSheet.columns.forEach(column => {
      column.width = 20;
    });

    // Add totals
    const totalPrice = reportData.earningsDetails.reduce((sum, b) => sum + (b.bookingPrice || 0), 0);
    const totalEarnings = reportData.earningsDetails.reduce((sum, b) => sum + (b.earnings || 0), 0);
    earningsSheet.addRow(['TOTALS', '', '', totalPrice, totalEarnings]);
    earningsSheet.getRow(earningsSheet.rowCount).font = { bold: true };
  }

  // Sheet 7: Services Done Details (if available)
  if (reportData.servicesDoneDetails && reportData.servicesDoneDetails.length > 0) {
    const servicesSheet = workbook.addWorksheet('Services Performed');
    
    servicesSheet.addRow(['Service Name', 'Total Count', 'Total Earnings (₹)', 'Avg per Service (₹)']);
    servicesSheet.getRow(1).font = { bold: true };
    servicesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDDDDD' }
    };

    reportData.servicesDoneDetails.forEach(item => {
      servicesSheet.addRow([
        item.serviceName,
        item.count,
        item.earnings,
        item.count > 0 ? (item.earnings / item.count).toFixed(2) : 0
      ]);
    });

    servicesSheet.columns.forEach(column => {
      column.width = 25;
    });

    // Add totals
    const totalCount = reportData.servicesDoneDetails.reduce((sum, s) => sum + (s.count || 0), 0);
    const totalEarnings = reportData.servicesDoneDetails.reduce((sum, s) => sum + (s.earnings || 0), 0);
    servicesSheet.addRow(['TOTALS', totalCount, totalEarnings, (totalEarnings / totalCount || 0).toFixed(2)]);
    servicesSheet.getRow(servicesSheet.rowCount).font = { bold: true };
  }

  // Sheet 8: Recent Bookings (existing sheet - rename to keep order)
  if (reportData.recentBookings && reportData.recentBookings.length > 0) {
    const recentBookingsSheet = workbook.addWorksheet('Recent Bookings (Last 10)');
    
    recentBookingsSheet.addRow(['Service', 'Customer', 'Date', 'Status', 'Earnings (₹)']);
    recentBookingsSheet.getRow(1).font = { bold: true };
    recentBookingsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDDDDD' }
    };

    reportData.recentBookings.forEach(booking => {
      recentBookingsSheet.addRow([
        booking.serviceName,
        booking.customerName,
        moment(booking.date).format('MMM DD, YYYY'),
        booking.status,
        booking.earnings
      ]);
    });

    recentBookingsSheet.columns.forEach(column => {
      column.width = 20;
    });
  }

  // Sheet 9: Service Breakdown (existing sheet - rename to keep order)
  if (reportData.serviceBreakdown && reportData.serviceBreakdown.length > 0) {
    const breakdownSheet = workbook.addWorksheet('Service Breakdown Analysis');
    
    breakdownSheet.addRow(['Service Name', 'Total Bookings', 'Total Earnings (₹)', 'Avg per Booking (₹)']);
    breakdownSheet.getRow(1).font = { bold: true };
    breakdownSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDDDDD' }
    };

    reportData.serviceBreakdown.forEach(item => {
      breakdownSheet.addRow([
        item.serviceName,
        item.bookings,
        item.earnings,
        item.bookings > 0 ? (item.earnings / item.bookings).toFixed(2) : 0
      ]);
    });

    breakdownSheet.columns.forEach(column => {
      column.width = 25;
    });

    // Add totals row
    const totalBookings = reportData.serviceBreakdown.reduce((sum, item) => sum + (item.bookings || 0), 0);
    const totalEarnings = reportData.serviceBreakdown.reduce((sum, item) => sum + (item.earnings || 0), 0);
    breakdownSheet.addRow(['TOTAL', totalBookings, totalEarnings, (totalEarnings / totalBookings || 0).toFixed(2)]);
    breakdownSheet.getRow(breakdownSheet.rowCount).font = { bold: true };
  }
};

module.exports = {
  generateExcel
};
