import mongoose, { Schema, Document } from 'mongoose';
import { ITherapist } from './Therapist'; // Import the Therapist interface

// Define the possible status values for a therapist's availability slot
export enum TherapistAvailabilityStatus {
  Available = 'available',
  Booked = 'booked',
  Unavailable = 'unavailable',
  OnLeave = 'on-leave'
}

// Define the interface for the TherapistAvailability document
export interface ITherapistAvailability extends Document {
  therapist: ITherapist['_id'] | ITherapist; // Reference to Therapist model
  date: Date; // The specific date for the availability slot
  startTime: string; // Start time in HH:MM format
  endTime: string; // End time in HH:MM format
  status: TherapistAvailabilityStatus; // Status of this time slot
  createdAt: Date;
  updatedAt: Date;
}

// Define the time format validation regex (HH:MM format in 24-hour format)
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Define the TherapistAvailability schema
const TherapistAvailabilitySchema: Schema<ITherapistAvailability> = new Schema({
  therapist: {
    type: Schema.Types.ObjectId,
    ref: 'Therapist',
    required: [true, 'Therapist reference is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    validate: {
      validator: (value: string) => timeFormatRegex.test(value),
      message: 'Start time must be in HH:MM format (24-hour)'
    }
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    validate: {
      validator: (value: string) => timeFormatRegex.test(value),
      message: 'End time must be in HH:MM format (24-hour)'
    }
  },
  status: {
    type: String,
    enum: {
      values: Object.values(TherapistAvailabilityStatus),
      message: 'Status must be either available, booked, unavailable, or on-leave'
    },
    default: TherapistAvailabilityStatus.Available
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Custom validation to ensure endTime is after startTime
TherapistAvailabilitySchema.path('endTime').validate(function(value: string) {
  const doc = this as ITherapistAvailability;
  
  // Only validate if both startTime and endTime are present
  if (doc.startTime && value) {
    // Convert times to minutes since midnight for comparison
    const [startHour, startMinute] = doc.startTime.split(':').map(Number);
    const [endHour, endMinute] = value.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    return endTotalMinutes > startTotalMinutes;
  }
  
  return true; // If one of the times is missing, validation passes to the required check
}, 'End time must be after start time');

// Create indexes for better query performance
TherapistAvailabilitySchema.index({ therapist: 1 }); // Index on therapist for quick lookups by therapist
TherapistAvailabilitySchema.index({ date: 1 }); // Index on date for date-based queries
TherapistAvailabilitySchema.index({ status: 1 }); // Index on status for filtering by status
TherapistAvailabilitySchema.index({ therapist: 1, date: 1 }); // Compound index for efficient therapist-date queries

// Create and export the TherapistAvailability model
const TherapistAvailabilityModel = mongoose.models.TherapistAvailability || mongoose.model<ITherapistAvailability>('TherapistAvailability', TherapistAvailabilitySchema);

export default TherapistAvailabilityModel;