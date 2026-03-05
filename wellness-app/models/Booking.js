const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required']
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID is required']
  },
  originalPrice: {
    type: Number,
    required: [true, 'Original price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountApplied: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  finalPrice: {
    type: Number,
    required: [true, 'Final price is required'],
    min: [0, 'Final price cannot be negative']
  },
  bookingDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
bookingSchema.index({ customerId: -1 });
bookingSchema.index({ serviceId: 1 });
bookingSchema.index({ bookingDate: -1 });

const BookingModel = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

module.exports = BookingModel;
