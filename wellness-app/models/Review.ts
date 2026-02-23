import mongoose, { Schema, Document } from 'mongoose';
import { IBooking } from './Booking';
import { IUser } from './User';
import { IService } from './Service';

// Define the interface for the Review document
export interface IReview extends Document {
  bookingId: IBooking['_id'] | IBooking; // Reference to Booking model
  customer: IUser['_id'] | IUser; // Reference to User model (customer)
  therapist: IUser['_id'] | IUser; // Reference to User model (therapist)
  service: IService['_id'] | IService; // Reference to Service model
  rating: number; // Rating from 1-5
  comment?: string; // Optional review comment
  createdAt: Date;
  updatedAt: Date;
}

// Define the Review schema
const ReviewSchema: Schema<IReview> = new Schema({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking reference is required'],
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer reference is required'],
  },
  therapist: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Therapist reference is required'],
  },
  service: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service reference is required'],
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
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create indexes for better query performance
ReviewSchema.index({ therapist: 1 }); // Index on therapist for faster rating calculation
ReviewSchema.index({ bookingId: 1 }, { unique: true }); // Unique index on bookingId to prevent duplicate reviews

// Create and export the Review model
const ReviewModel = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default ReviewModel;