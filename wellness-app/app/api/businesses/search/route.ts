import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import BusinessModel from '../../../../models/Business';
import { ServiceType } from '../../../../models/Business';
import ReviewModel from '../../../../models/Review';
import BookingModel from '../../../../models/Booking';
import ServiceModel from '../../../../models/Service';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    
    // Extract query parameters
    const searchTerm = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const country = searchParams.get('country') || '';
    const state = searchParams.get('state') || '';
    const city = searchParams.get('city') || '';
    const serviceType = searchParams.get('serviceType') || '';
    const minRatingStr = searchParams.get('minRating') || '';
    const minRating = minRatingStr ? parseFloat(minRatingStr) : 0;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build query object
    const query: any = { status: 'active' };

    // Add search term filter (search in business name and description)
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { serviceName: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Add location filters
    if (location) {
      query.$or = [
        { 'address.city': { $regex: location, $options: 'i' } },
        { 'address.state': { $regex: location, $options: 'i' } },
        { 'address.zipCode': { $regex: location, $options: 'i' } }
      ];
    }
    
    // Add country filter
    if (country) {
      query['address.country'] = country;
    }
    
    // Add state filter
    if (state) {
      query['address.state'] = state;
    }
    
    // Add city filter
    if (city) {
      query['address.city'] = city;
    }

    // Add service type filter
    if (serviceType && Object.values(ServiceType).includes(serviceType as ServiceType)) {
      query.serviceType = serviceType;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // First, get the basic business data
    let businesses = await BusinessModel.find(query, {
      _id: 1,
      name: 1,
      description: 1,
      serviceType: 1,
      serviceName: 1,
      address: 1,
      phone: 1,
      email: 1,
      website: 1,
      openingTime: 1,
      closingTime: 1,
      businessHours: 1,
      status: 1,
      createdAt: 1
    })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(); // Convert to plain objects

    // If no minRating filter is applied, calculate ratings for all businesses anyway to display them
    if (minRating <= 0) {
      // Get all business IDs to calculate their ratings
      const businessIds = businesses.map(business => business._id);

      // Calculate ratings for these businesses
      const ratingMap = new Map();
      
      // Get all services for these businesses
      const services = await ServiceModel.find({
        business: { $in: businessIds }
      }, { _id: 1, business: 1 });

      const serviceIds = services.map(service => service._id);
      
      // Get all bookings for these services
      const bookings = await BookingModel.find({
        service: { $in: serviceIds }
      }, { _id: 1, service: 1 });

      const bookingIds = bookings.map(booking => booking._id);
      
      // Get all reviews for these bookings
      const reviews = await ReviewModel.find({
        booking: { $in: bookingIds }
      }, { rating: 1, booking: 1 });

      // Group reviews by business
      const businessReviews = new Map();
      
      for (const review of reviews) {
        // Find which business this review belongs to
        const booking = bookings.find(b => b._id.toString() === review.booking.toString());
        if (booking) {
          const service = services.find(s => s._id.toString() === booking.service.toString());
          if (service) {
            const businessId = service.business.toString();
            if (!businessReviews.has(businessId)) {
              businessReviews.set(businessId, []);
            }
            businessReviews.get(businessId).push(review.rating);
          }
        }
      }

      // Add avgRating to each business
      businesses = businesses.map(business => {
        const ratings = businessReviews.get(business._id.toString()) || [];
        const avgRating = ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;
        return { ...business, avgRating };
      });
    }

    // Get total count before applying rating filter
    let total = await BusinessModel.countDocuments(query);

    // If minRating is specified, we need to calculate ratings for each business
    if (minRating > 0) {
      // Get all business IDs to calculate their ratings
      const allBusinesses = await BusinessModel.find(query, {
        _id: 1,
        name: 1,
        description: 1,
        serviceType: 1,
        serviceName: 1,
        address: 1,
        phone: 1,
        email: 1,
        website: 1,
        openingTime: 1,
        closingTime: 1,
        businessHours: 1,
        status: 1,
        createdAt: 1
      }).lean();

      // Calculate ratings for all businesses
      const ratingMap = new Map();
      
      // Get all services for all businesses
      const services = await ServiceModel.find({
        business: { $in: allBusinesses.map(b => b._id) }
      }, { _id: 1, business: 1 });

      const serviceIds = services.map(service => service._id);
      
      // Get all bookings for these services
      const bookings = await BookingModel.find({
        service: { $in: serviceIds }
      }, { _id: 1, service: 1 });

      const bookingIds = bookings.map(booking => booking._id);
      
      // Get all reviews for these bookings
      const reviews = await ReviewModel.find({
        booking: { $in: bookingIds }
      }, { rating: 1, booking: 1 });

      // Group reviews by business
      const businessReviews = new Map();
      
      for (const review of reviews) {
        // Find which business this review belongs to
        const booking = bookings.find(b => b._id.toString() === review.booking.toString());
        if (booking) {
          const service = services.find(s => s._id.toString() === booking.service.toString());
          if (service) {
            const businessId = service.business.toString();
            if (!businessReviews.has(businessId)) {
              businessReviews.set(businessId, []);
            }
            businessReviews.get(businessId).push(review.rating);
          }
        }
      }

      // Calculate average ratings and filter businesses
      const filteredBusinessesWithRatings = allBusinesses.map(business => {
        const ratings = businessReviews.get(business._id.toString()) || [];
        const avgRating = ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;
        return { ...business, avgRating };
      }).filter(business => business.avgRating >= minRating);

      // Apply pagination to the filtered results
      const startIndex = (page - 1) * limit;
      businesses = filteredBusinessesWithRatings.slice(startIndex, startIndex + limit);
      total = filteredBusinessesWithRatings.length;
    }

    // Get unique locations, countries, and service types for filter options
    const [locations, countries, serviceTypes] = await Promise.all([
      BusinessModel.distinct('address.city', { status: 'active' }),
      BusinessModel.distinct('address.country', { status: 'active' }),
      BusinessModel.distinct('serviceType', { status: 'active' })
    ]);

    // Remove duplicates from countries
    const uniqueCountries = Array.from(new Set(countries)).filter(Boolean).sort();
    
    // Get unique states based on the selected country if provided
    let uniqueStates: string[] = [];
    if (country) {
      // If a country is specified, only get states from that country
      const statesInCountry = await BusinessModel.distinct('address.state', { 
        status: 'active', 
        'address.country': country 
      });
      uniqueStates = Array.from(new Set(statesInCountry)).filter(Boolean).sort();
    } else {
      // Otherwise, get all states
      const allStates = await BusinessModel.distinct('address.state', { status: 'active' });
      uniqueStates = Array.from(new Set(allStates)).filter(Boolean).sort();
    }
    
    // Get unique cities based on the selected country and state if provided
    let uniqueCities: string[] = [];
    if (country && state) {
      // If both country and state are specified, only get cities from that state
      const citiesInState = await BusinessModel.distinct('address.city', { 
        status: 'active', 
        'address.country': country,
        'address.state': state
      });
      uniqueCities = Array.from(new Set(citiesInState)).filter(Boolean).sort();
    } else if (country) {
      // If only country is specified, get cities from that country
      const citiesInCountry = await BusinessModel.distinct('address.city', { 
        status: 'active', 
        'address.country': country 
      });
      uniqueCities = Array.from(new Set(citiesInCountry)).filter(Boolean).sort();
    } else {
      // Otherwise, get all cities
      const allCities = await BusinessModel.distinct('address.city', { status: 'active' });
      uniqueCities = Array.from(new Set(allCities)).filter(Boolean).sort();
    }

    return Response.json({
      success: true,
      message: 'Businesses retrieved successfully',
      data: {
        businesses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        },
        filters: {
          locations: locations.sort(),
          countries: uniqueCountries,
          states: uniqueStates,
          cities: uniqueCities,
          serviceTypes: serviceTypes.filter(Boolean).sort()
        }
      }
    });

  } catch (error: any) {
    console.error('Error searching businesses:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}