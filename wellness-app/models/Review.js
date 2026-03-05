const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate reviews and improve query performance
reviewSchema.index({ customerId: 1, serviceId: 1 }, { unique: true });

// Index for faster queries by customer
reviewSchema.index({ customerId: -1 });

const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema);

module.exports = ReviewModel;
