import mongoose, { Schema, Document } from 'mongoose';
import { IBooking } from './Booking'; // Import the Booking interface

// Define the interface for the Review document
export interface IReview extends Document {
  booking: IBooking['_id'] | IBooking; // Reference to Booking model
  rating: number; // Customer rating (1-5)
  comment?: string; // Customer's written feedback (optional)
  reviewDate?: Date; // Date when review was submitted (optional)
  createdAt: Date;
  updatedAt: Date;
}

// Define the Review schema
const ReviewSchema: Schema<IReview> = new Schema({
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking reference is required'],
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
  reviewDate: {
    type: Date,
    default: Date.now // Default to current date if not provided
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create indexes for better query performance
ReviewSchema.index({ booking: 1 }); // Index on booking for quick lookups by booking
ReviewSchema.index({ rating: 1 }); // Index on rating for rating-based queries
ReviewSchema.index({ reviewDate: 1 }); // Index on review date for date-based queries
ReviewSchema.index({ createdAt: -1 }); // Index on creation date for sorting by newest

// Create and export the Review model
const ReviewModel = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default ReviewModel;