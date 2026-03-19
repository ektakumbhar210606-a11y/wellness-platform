const mongoose = require('mongoose');

// Helper function to get models - they will be registered when their .ts files are imported
function getModel(modelName) {
  return mongoose.models[modelName];
}

/**
 * Generate customer report
 * @param {string} userId - Customer user ID
 * @returns {Promise<object>} Customer report data
 */
const getCustomerReport = async (userId) => {
  try {
    const BookingModel = getModel('Booking');
    const ServiceModel = getModel('Service');
    const TherapistModel = getModel('Therapist');
    
    if (!BookingModel) {
      throw new Error('Booking model not registered. Make sure Booking.ts has been imported.');
    }
    
    console.log('getCustomerReport called with userId:', userId);
    console.log('userId type:', typeof userId);
    
    // Validate user ID and convert to ObjectId if it's a string
    let customerId;
    if (typeof userId === 'string') {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error('Invalid user ID format:', userId);
        throw new Error('Invalid user ID: ' + userId);
      }
      customerId = new mongoose.Types.ObjectId(userId);
      console.log('Converted userId to ObjectId:', customerId);
    } else if (userId instanceof mongoose.Types.ObjectId) {
      customerId = userId;
      console.log('userId is already ObjectId:', customerId);
    } else {
      console.error('Invalid userId type:', typeof userId, userId);
      throw new Error('Invalid user ID type: ' + typeof userId);
    }
    
    console.log('Using customerId (ObjectId):', customerId);

    // Get all bookings for this customer
    console.log('Searching bookings for customer:', customerId);
    
    let bookings;
    try {
      const queryObj = { customer: customerId };
      console.log('Query object:', JSON.stringify(queryObj));
      
      bookings = await BookingModel.find(queryObj)
        .populate('service', 'name price')
        .populate('therapist', 'fullName')
        .sort({ createdAt: -1 });
      
      console.log('Found bookings count:', bookings.length);
      if (bookings.length > 0) {
        console.log('First booking sample:', {
          id: bookings[0]._id,
          customer: bookings[0].customer,
          status: bookings[0].status,
          service: bookings[0].service,
          therapist: bookings[0].therapist
        });
      }
    } catch (queryError) {
      console.error('Error querying bookings:', queryError);
      console.error('Query error stack:', queryError.stack);
      throw new Error('Failed to fetch bookings: ' + (queryError instanceof Error ? queryError.message : 'Unknown error'));
    }

    // Calculate statistics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    
    // Calculate total spent and discount used
    const totalSpent = bookings.reduce((sum, booking) => {
      // Try multiple price fields for backward compatibility
      const price = booking.finalPrice || booking.originalPrice || booking.service?.price || 0;
      return sum + price;
    }, 0);
    
    const totalDiscountUsed = bookings.reduce((sum, booking) => {
      return sum + (booking.rewardDiscountAmount || booking.discountApplied || 0);
    }, 0);

    // Find most booked service
    const serviceCount = {};
    bookings.forEach(booking => {
      const serviceName = booking.service?.name || 'Unknown Service';
      serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;
    });

    let mostBookedService = null;
    let maxCount = 0;
    Object.entries(serviceCount).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostBookedService = name;
      }
    });

    // Get recent bookings (last 5)
    const recentBookings = bookings.slice(0, 5).map(booking => ({
      id: booking._id.toString(),
      serviceName: booking.service?.name || 'N/A',
      therapistName: booking.therapist?.fullName || 'N/A',
      date: booking.date,
      time: booking.time,
      status: booking.status,
      // Try multiple price fields for backward compatibility
      finalPrice: booking.finalPrice || booking.originalPrice || booking.service?.price || 0,
      discountApplied: booking.rewardDiscountApplied || booking.discountApplied || false
    }));

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalSpent,
      totalDiscountUsed,
      mostBookedService,
      recentBookings
    };
  } catch (error) {
    console.error('Error in getCustomerReport:', error);
    throw error;
  }
};

/**
 * Generate business report
 * @param {string} businessId - Business ID
 * @returns {Promise<object>} Business report data
 */
const getBusinessReport = async (businessId) => {
  try {
    const ServiceModel = getModel('Service');
    const TherapistModel = getModel('Therapist');
    const BookingModel = getModel('Booking');
    
    if (!ServiceModel || !TherapistModel || !BookingModel) {
      throw new Error('Models not registered. Make sure .ts files have been imported.');
    }
  
    // Validate business ID
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new Error('Invalid business ID');
    }

    // Count total services
    const totalServices = await ServiceModel.countDocuments({ business: businessId });

    // Count total therapists associated with this business
    const totalTherapists = await TherapistModel.countDocuments({ 
      businessAssociations: { $elemMatch: { businessId: businessId } }
    });

    // Get all bookings for this business's services
    const services = await ServiceModel.find({ business: businessId }).select('_id');
    const serviceIds = services.map(s => s._id);
    
    const bookings = await BookingModel.find({ 
      service: { $in: serviceIds }
    })
      .populate('therapist', 'fullName')
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    // Calculate booking statistics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

    // Calculate total revenue (from completed bookings)
    const totalRevenue = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, booking) => sum + (booking.finalPrice || 0), 0);

    // Find most booked service
    const serviceCount = {};
    await Promise.all(bookings.map(async (booking) => {
      const service = await ServiceModel.findById(booking.service);
      const serviceName = service?.name || 'Unknown Service';
      serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;
    }));

    let mostBookedService = null;
    let maxCount = 0;
    Object.entries(serviceCount).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostBookedService = name;
      }
    });

    // Find top therapist (most bookings)
    const therapistCount = {};
    bookings.forEach(booking => {
      const therapistId = booking.therapist?._id?.toString();
      if (therapistId) {
        therapistCount[therapistId] = (therapistCount[therapistId] || 0) + 1;
      }
    });

    let topTherapistId = null;
    let topTherapistName = null;
    let maxTherapistBookings = 0;
    
    for (const [therapistId, count] of Object.entries(therapistCount)) {
      if (count > maxTherapistBookings) {
        maxTherapistBookings = count;
        topTherapistId = therapistId;
        const therapist = await TherapistModel.findById(therapistId);
        topTherapistName = therapist?.fullName || 'Unknown Therapist';
      }
    }

    // Calculate monthly revenue
    const monthlyRevenue = {};
    bookings
      .filter(b => b.status === 'completed')
      .forEach(booking => {
        // Validate createdAt date before using it
        if (!booking.createdAt || !new Date(booking.createdAt).toISOString()) {
          console.warn('Invalid createdAt date for booking in business report:', booking._id);
          return; // Skip this booking
        }
        
        const month = new Date(booking.createdAt).toISOString().slice(0, 7); // YYYY-MM
        // Use price fallback logic for backward compatibility (check service.price too)
        const bookingPrice = booking.finalPrice || booking.originalPrice || booking.service?.price || 0;
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + bookingPrice;
      });

    // Convert to array format for easier frontend consumption
    const monthlyRevenueArray = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    })).sort((a, b) => b.month.localeCompare(a.month));

    return {
      totalServices,
      totalTherapists,
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      mostBookedService,
      topTherapist: {
        id: topTherapistId,
        name: topTherapistName,
        bookings: maxTherapistBookings
      },
      monthlyRevenue: monthlyRevenueArray
    };
  } catch (error) {
    console.error('Error in getBusinessReport:', error);
    throw error;
  }
};

/**
 * Generate therapist report
 * @param {string} therapistId - Therapist ID
 * @returns {Promise<object>} Therapist report data
 */
const getTherapistReport = async (therapistId) => {
  try {
    const BookingModel = getModel('Booking');
    const ServiceModel = getModel('Service');
    
    if (!BookingModel || !ServiceModel) {
      throw new Error('Models not registered. Make sure .ts files have been imported.');
    }
  
    // Validate therapist ID
    if (!mongoose.Types.ObjectId.isValid(therapistId)) {
      throw new Error('Invalid therapist ID');
    }

    // Get all bookings for this therapist
    const bookings = await BookingModel.find({ therapist: therapistId })
      .populate({
        path: 'service',
        select: 'name business'
      })
      .populate({
        path: 'customer',
        select: 'name email'
      })
      .sort({ createdAt: -1 });

    // Calculate booking statistics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

    // Calculate total earnings (from completed bookings)
    // Assuming therapist gets a percentage of the booking price (e.g., 70%)
    const therapistPercentage = 0.7;
    const totalEarnings = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, booking) => {
        const bookingPrice = booking.finalPrice || booking.originalPrice || booking.service?.price || 0;
        return sum + (bookingPrice * therapistPercentage);
      }, 0);

    // Count unique services worked on
    const uniqueServices = new Set(bookings.map(b => b.service?._id?.toString()).filter(Boolean));
    const totalServicesDone = uniqueServices.size;

    // Calculate monthly cancellation count
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyCancelCount = bookings.filter(b => 
      b.status === 'cancelled' && 
      b.cancelledAt && 
      new Date(b.cancelledAt) >= currentMonthStart
    ).length;

    // Calculate bonus/penalty percentage based on cancellation rate
    let bonusPenaltyPercentage = 0;
    if (totalBookings > 0) {
      const cancellationRate = (cancelledBookings / totalBookings) * 100;
      
      // Example logic: if cancellation rate < 5%, give 5% bonus
      // If cancellation rate > 20%, apply 10% penalty
      if (cancellationRate < 5) {
        bonusPenaltyPercentage = 5; // Bonus
      } else if (cancellationRate > 20) {
        bonusPenaltyPercentage = -10; // Penalty
      }
    }

    // Get recent bookings for display
    const recentBookings = bookings.slice(0, 5).map(booking => {
      const bookingPrice = booking.finalPrice || booking.originalPrice || booking.service?.price || 0;
      
      return {
        id: booking._id.toString(),
        serviceName: booking.service?.name || 'N/A',
        customerName: booking.customer?.name || 'N/A',
        date: booking.date ? new Date(booking.date).toISOString() : null,
        time: booking.time || '',
        status: booking.status,
        earnings: booking.status === 'completed' ? bookingPrice * therapistPercentage : 0
      };
    });

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalEarnings,
      totalServicesDone,
      monthlyCancelCount,
      bonusPenaltyPercentage,
      recentBookings
    };
  } catch (error) {
    console.error('Error in getTherapistReport:', error);
    throw error;
  }
};

/**
 * Generate custom therapist report based on selected fields
 * @param {string} therapistId - Therapist ID
 * @param {string[]} selectedFields - Array of field keys to include
 * @returns {Promise<object>} Custom therapist report data
 */
const getTherapistCustomReport = async (therapistId, selectedFields) => {
  try {
    const BookingModel = getModel('Booking');
    const ServiceModel = getModel('Service');
    
    if (!BookingModel || !ServiceModel) {
      throw new Error('Models not registered. Make sure .ts files have been imported.');
    }
  
    // Validate therapist ID
    if (!mongoose.Types.ObjectId.isValid(therapistId)) {
      throw new Error('Invalid therapist ID');
    }

    // Get all bookings for this therapist with full population
    const bookings = await BookingModel.find({ therapist: therapistId })
      .populate({
        path: 'service',
        select: 'name price duration description'
      })
      .populate({
        path: 'customer',
        select: 'name email'
      })
      .sort({ createdAt: -1 });

    // Debug: Log sample booking data to verify population
    console.log('=== THERAPIST REPORT DEBUG ===');
    console.log('Total bookings found:', bookings.length);
    if (bookings.length > 0) {
      const sample = bookings[0];
      console.log('Sample booking:', {
        _id: sample._id,
        customer: sample.customer,
        finalPrice: sample.finalPrice,
        originalPrice: sample.originalPrice,
        service: sample.service ? sample.service.name : 'No service',
        servicePrice: sample.service?.price,
        fullServiceObj: sample.service,
        status: sample.status,
        createdAt: sample.createdAt,
        date: sample.date,
        time: sample.time
      });
    }
    console.log('===========================');

    const reportData = {};

    // Process each selected field
    for (const field of selectedFields) {
      switch (field) {
        case 'totalBookings': {
          reportData.totalBookings = bookings.length;
          // Include detailed bookings list
          reportData.allBookingsDetails = bookings.map(booking => {
            // Get price - try multiple fields for backward compatibility
            let bookingPrice = booking.finalPrice || booking.originalPrice || booking.service?.price || 0;
            
            // Debug: Log if price is still 0
            if (bookingPrice === 0) {
              console.log('Warning: No price found for booking', booking._id, {
                finalPrice: booking.finalPrice,
                originalPrice: booking.originalPrice,
                servicePrice: booking.service?.price,
                serviceName: booking.service?.name
              });
            }
            
            const therapistEarnings = booking.status === 'completed' ? bookingPrice * 0.7 : 0;
            
            return {
              _id: booking._id.toString(),
              serviceName: booking.service?.name || 'N/A',
              customerName: booking.customer?.name || 'N/A',
              date: booking.date ? new Date(booking.date).toISOString() : null,
              time: booking.time || '',
              status: booking.status,
              earnings: therapistEarnings,
              createdAt: booking.createdAt
            };
          });
          break;
        }

        case 'completedBookings': {
          const completed = bookings.filter(b => b.status === 'completed');
          reportData.completedBookings = completed.length;
          // Include detailed completed bookings list
          reportData.completedBookingsDetails = completed.map(booking => {
            // Get price - try multiple fields for backward compatibility
            const bookingPrice = booking.finalPrice || booking.originalPrice || booking.service?.price || 0;
            const therapistEarnings = bookingPrice * 0.7;
            
            return {
              _id: booking._id.toString(),
              serviceName: booking.service?.name || 'N/A',
              customerName: booking.customer?.name || 'N/A',
              date: booking.date ? new Date(booking.date).toISOString() : null,
              time: booking.time || '',
              status: booking.status,
              earnings: therapistEarnings,
              createdAt: booking.createdAt
            };
          });
          break;
        }

        case 'cancelledBookings': {
          const cancelled = bookings.filter(b => b.status === 'cancelled');
          reportData.cancelledBookings = cancelled.length;
          // Include detailed cancelled bookings list
          reportData.cancelledBookingsDetails = cancelled.map(booking => ({
            _id: booking._id.toString(),
            serviceName: booking.service?.name || 'N/A',
            customerName: booking.customer?.name || 'N/A',
            date: booking.date ? new Date(booking.date).toISOString() : null,
            time: booking.time || '',
            status: booking.status,
            cancellationReason: booking.cancellationReason || booking.customerCancelReason || booking.therapistCancelReason || 'N/A',
            cancelledAt: booking.cancelledAt,
            createdAt: booking.createdAt
          }));
          break;
        }

        case 'totalEarnings': {
          const therapistPercentage = 0.7;
          const completed = bookings.filter(b => b.status === 'completed');
          const totalEarnings = completed.reduce((sum, booking) => {
            const bookingPrice = booking.finalPrice || booking.originalPrice || booking.service?.price || 0;
            return sum + (bookingPrice * therapistPercentage);
          }, 0);
          
          reportData.totalEarnings = totalEarnings;
          
          // Include earnings breakdown
          reportData.earningsDetails = completed.map(booking => {
            // Get price - try multiple fields for backward compatibility
            const bookingPrice = booking.finalPrice || booking.originalPrice || booking.service?.price || 0;
            
            return {
              _id: booking._id.toString(),
              serviceName: booking.service?.name || 'N/A',
              customerName: booking.customer?.name || 'N/A',
              date: booking.date ? new Date(booking.date).toISOString() : null,
              bookingPrice: bookingPrice,
              earnings: bookingPrice * therapistPercentage,
              createdAt: booking.createdAt
            };
          });
          break;
        }

        case 'totalServicesDone': {
          const uniqueServices = new Set(bookings.map(b => b.service?._id?.toString()).filter(Boolean));
          reportData.totalServicesDone = uniqueServices.size;
          // Include services breakdown with details
          const serviceMap = {};
          bookings.forEach(booking => {
            const serviceId = booking.service?._id?.toString();
            if (serviceId && booking.service) {
              if (!serviceMap[serviceId]) {
                serviceMap[serviceId] = {
                  serviceId,
                  serviceName: booking.service.name || 'Unknown Service',
                  count: 0,
                  earnings: 0
                };
              }
              serviceMap[serviceId].count += 1;
              if (booking.status === 'completed') {
                // Use price fallback logic for backward compatibility
                const bookingPrice = booking.finalPrice || booking.originalPrice || booking.service?.price || 0;
                serviceMap[serviceId].earnings += bookingPrice * 0.7;
              }
            }
          });
          reportData.servicesDoneDetails = Object.values(serviceMap);
          break;
        }

        case 'monthlyCancelCount': {
          const now = new Date();
          const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          reportData.monthlyCancelCount = bookings.filter(b => 
            b.status === 'cancelled' && 
            b.cancelledAt && 
            new Date(b.cancelledAt) >= currentMonthStart
          ).length;
          break;
        }

        case 'bonusPenaltyPercentage': {
          const totalBookings = bookings.length;
          const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
          let bonusPenaltyPercentage = 0;
          if (totalBookings > 0) {
            const cancellationRate = (cancelledBookings / totalBookings) * 100;
            if (cancellationRate < 5) {
              bonusPenaltyPercentage = 5;
            } else if (cancellationRate > 20) {
              bonusPenaltyPercentage = -10;
            }
          }
          reportData.bonusPenaltyPercentage = bonusPenaltyPercentage;
          break;
        }

        case 'recentBookings': {
          const therapistPercentage = 0.7;
          reportData.recentBookings = bookings.slice(0, 10).map(booking => {
            // Get price - try multiple fields for backward compatibility
            const bookingPrice = booking.finalPrice || booking.originalPrice || booking.service?.price || 0;
            
            return {
              _id: booking._id.toString(),
              serviceName: booking.service?.name || 'N/A',
              customerName: booking.customer?.name || 'N/A',
              date: booking.date ? new Date(booking.date).toISOString() : null,
              time: booking.time || '',
              status: booking.status,
              earnings: booking.status === 'completed' ? bookingPrice * therapistPercentage : 0
            };
          });
          break;
        }

        case 'monthlyRevenue': {
          const monthlyRevenue = {};
          let processedCount = 0;
          let skippedCount = 0;
          
          bookings
            .filter(b => b.status === 'completed')
            .forEach(booking => {
              // Validate createdAt date before using it
              if (!booking.createdAt || !new Date(booking.createdAt).toISOString()) {
                console.warn('Invalid createdAt date for booking:', booking._id);
                skippedCount++;
                return; // Skip this booking
              }
              
              const month = new Date(booking.createdAt).toISOString().slice(0, 7); // YYYY-MM
              const therapistPercentage = 0.7;
              // Use price fallback logic for backward compatibility (check service.price too)
              const bookingPrice = booking.finalPrice || booking.originalPrice || booking.service?.price || 0;
              
              // Debug log for price issues
              if (bookingPrice === 0) {
                console.log('Processing booking', booking._id, ':', {
                  month,
                  finalPrice: booking.finalPrice,
                  originalPrice: booking.originalPrice,
                  servicePrice: booking.service?.price,
                  bookingPrice,
                  revenue: 0
                });
              }
              
              const revenue = bookingPrice * therapistPercentage;
              
              console.log(`Processing booking ${booking._id}:`, {
                month,
                finalPrice: booking.finalPrice,
                originalPrice: booking.originalPrice,
                bookingPrice,
                revenue
              });
              
              monthlyRevenue[month] = (monthlyRevenue[month] || 0) + revenue;
              processedCount++;
            });
          
          console.log(`Monthly Revenue: Processed ${processedCount} bookings, Skipped ${skippedCount} bookings`);
          console.log('Monthly revenue data:', monthlyRevenue);

          reportData.monthlyRevenue = Object.entries(monthlyRevenue)
            .map(([month, revenue]) => ({ month, revenue }))
            .sort((a, b) => b.month.localeCompare(a.month));
          break;
        }

        case 'serviceBreakdown': {
          const serviceStats = {};
          const therapistPercentage = 0.7;
          
          bookings.forEach(booking => {
            const serviceName = booking.service?.name || 'Unknown Service';
            if (!serviceStats[serviceName]) {
              serviceStats[serviceName] = {
                serviceName,
                bookings: 0,
                earnings: 0
              };
            }
            serviceStats[serviceName].bookings += 1;
            if (booking.status === 'completed') {
              serviceStats[serviceName].earnings += (booking.finalPrice || 0) * therapistPercentage;
            }
          });

          reportData.serviceBreakdown = Object.values(serviceStats);
          break;
        }

        default:
          console.warn(`Unknown field: ${field}`);
      }
    }

    return reportData;
  } catch (error) {
    console.error('Error in getTherapistCustomReport:', error);
    throw error;
  }
};

module.exports = {
  getCustomerReport,
  getBusinessReport,
  getTherapistReport,
  getTherapistCustomReport
};
