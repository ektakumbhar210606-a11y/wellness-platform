import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User'; // Import the User interface
import { ITherapist } from './Therapist'; // Import the Therapist interface
import { IService } from './Service'; // Import the Service interface

// Define the possible status values for a booking
export enum BookingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Completed = 'completed',
  Cancelled = 'cancelled',
  NoShow = 'no-show'
}

// Define the interface for the Booking document
export interface IBooking extends Document {
  customer: IUser['_id'] | IUser; // Reference to User model (customer)
  therapist: ITherapist['_id'] | ITherapist; // Reference to Therapist model
  service: IService['_id'] | IService; // Reference to Service model
  date: Date; // Date of the booking
  time: string; // Time in HH:MM format
  status: BookingStatus; // Status of the booking
  createdAt: Date;
  updatedAt: Date;
}

// Define the time format validation regex (HH:MM format in 24-hour format)
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Define the Booking schema
const BookingSchema: Schema<IBooking> = new Schema({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer reference is required'],
  },
  therapist: {
    type: Schema.Types.ObjectId,
    ref: 'Therapist',
    required: [true, 'Therapist reference is required'],
  },
  service: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service reference is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    validate: {
      validator: (value: string) => timeFormatRegex.test(value),
      message: 'Time must be in HH:MM format (24-hour)'
    }
  },
  status: {
    type: String,
    enum: {
      values: Object.values(BookingStatus),
      message: 'Status must be either pending, confirmed, completed, cancelled, or no-show'
    },
    default: BookingStatus.Pending
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create indexes for better query performance
BookingSchema.index({ customer: 1 }); // Index on customer for quick lookups by customer
BookingSchema.index({ therapist: 1 }); // Index on therapist for quick lookups by therapist
BookingSchema.index({ service: 1 }); // Index on service for quick lookups by service
BookingSchema.index({ date: 1 }); // Index on date for date-based queries
BookingSchema.index({ status: 1 }); // Index on status for filtering by status
BookingSchema.index({ customer: 1, date: 1 }); // Compound index for customer-date queries
BookingSchema.index({ therapist: 1, date: 1 }); // Compound index for therapist-date queries

// Create and export the Booking model
const BookingModel = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default BookingModel;