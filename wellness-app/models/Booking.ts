import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User'; // Import the User interface
import { ITherapist } from './Therapist'; // Import the Therapist interface
import { IService } from './Service'; // Import the Service interface

// Define the possible status values for a booking
export enum BookingStatus {
  Pending = 'pending',
  TherapistConfirmed = 'therapist_confirmed',
  TherapistRejected = 'therapist_rejected',
  Confirmed = 'confirmed',
  Paid = 'paid',
  Completed = 'completed',
  Cancelled = 'cancelled',
  NoShow = 'no-show',
  Rescheduled = 'rescheduled'
}

// Define the interface for the Booking document
export interface IBooking extends Document {
  customer: IUser['_id'] | IUser; // Reference to User model (customer)
  therapist: ITherapist['_id'] | ITherapist; // Reference to Therapist model
  service: IService['_id'] | IService; // Reference to Service model
  date: Date; // Date of the booking
  time: string; // Time in HH:MM format
  status: BookingStatus; // Status of the booking
  notes?: string; // Optional booking notes
  duration?: number; // Optional booking duration
  assignedByAdmin?: boolean; // Whether this booking was explicitly assigned by an admin
  assignedById?: string; // ID of the admin who assigned the booking
  therapistResponded?: boolean; // Whether the therapist has responded to the assignment
  notificationDestination?: 'customer' | 'business'; // Who should receive notifications for this booking
  responseVisibleToBusinessOnly?: boolean; // Whether therapist responses should only be visible to business (not customer)
  originalDate?: Date; // Original booking date (for tracking reschedules)
  originalTime?: string; // Original booking time (for tracking reschedules)
  rescheduledBy?: string; // ID of the user who rescheduled the booking (therapist or business)
  rescheduledAt?: Date; // When the booking was rescheduled
  confirmedBy?: string; // ID of the user who confirmed the booking (therapist or business)
  confirmedAt?: Date; // When the booking was confirmed
  cancelledBy?: string; // ID of the user who cancelled the booking (therapist or business)
  cancelledAt?: Date; // When the booking was cancelled
  completedAt?: Date; // When the booking was completed
  paymentStatus?: 'pending' | 'partial' | 'completed'; // Overall payment status of the booking
  therapistPayoutStatus?: 'pending' | 'paid'; // Status of payout to therapist
  therapistPayoutAmount?: number; // Amount paid to therapist
  therapistPaidAt?: Date; // When therapist was paid
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
      values: ['pending', 'therapist_confirmed', 'therapist_rejected', 'confirmed', 'paid', 'completed', 'cancelled', 'no-show', 'rescheduled'],
      message: 'Status must be either pending, therapist_confirmed, therapist_rejected, confirmed, paid, completed, cancelled, no-show, or rescheduled'
    },
    default: BookingStatus.Pending
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  duration: {
    type: Number,
    min: [1, 'Duration must be at least 1 minute']
  },
  assignedByAdmin: {
    type: Boolean,
    default: false // By default, bookings are not explicitly assigned by admin
  },
  assignedById: {
    type: String,
    ref: 'User' // Reference to the admin who assigned the booking
  },
  therapistResponded: {
    type: Boolean,
    default: false // By default, therapist has not responded
  },
  notificationDestination: {
    type: String,
    enum: ['customer', 'business'],
    default: 'customer' // By default, notifications go to customer
  },
  responseVisibleToBusinessOnly: {
    type: Boolean,
    default: false // By default, responses are visible to customer
  },
  originalDate: {
    type: Date, // Original booking date (for tracking reschedules)
    required: false
  },
  originalTime: {
    type: String, // Original booking time (for tracking reschedules)
    required: false
  },
  rescheduledBy: {
    type: String, // ID of the user who rescheduled the booking (therapist or business)
    required: false
  },
  rescheduledAt: {
    type: Date, // When the booking was rescheduled
    required: false
  },
  confirmedBy: {
    type: String, // ID of the user who confirmed the booking (therapist or business)
    required: false
  },
  confirmedAt: {
    type: Date, // When the booking was confirmed
    required: false
  },
  cancelledBy: {
    type: String, // ID of the user who cancelled the booking (therapist or business)
    required: false
  },
  cancelledAt: {
    type: Date, // When the booking was cancelled
    required: false
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending'
  },
  therapistPayoutStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  therapistPayoutAmount: {
    type: Number,
    required: false
  },
  therapistPaidAt: {
    type: Date,
    required: false
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