import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

// Define the interface for the TherapistBonus document
export interface ITherapistBonus extends Document {
  therapist: IUser['_id'] | IUser; // Reference to User model (therapist)
  business: IUser['_id'] | IUser; // Reference to User model (business)
  month: number; // Month (1-12)
  year: number; // Year (YYYY)
  averageRating?: number; // Average rating for the month
  totalReviews?: number; // Total reviews for the month
  bonusAmount?: number; // Amount of bonus
  status: 'pending' | 'paid'; // Status of the bonus
  createdAt: Date;
}

// Define the TherapistBonus schema
const TherapistBonusSchema: Schema<ITherapistBonus> = new Schema({
  therapist: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Therapist reference is required'],
  },
  business: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Business reference is required'],
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: [1, 'Month must be at least 1'],
    max: [12, 'Month cannot exceed 12']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1970, 'Year must be a valid year'],
    max: [2100, 'Year must be a valid year']
  },
  averageRating: {
    type: Number,
    min: [0, 'Average rating cannot be negative'],
    max: [5, 'Average rating cannot exceed 5']
  },
  totalReviews: {
    type: Number,
    min: [0, 'Total reviews cannot be negative']
  },
  bonusAmount: {
    type: Number,
    min: [0, 'Bonus amount cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'paid'],
      message: 'Status must be either pending or paid'
    },
    default: 'pending'
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create a unique compound index on therapist + month + year
TherapistBonusSchema.index({ therapist: 1, month: 1, year: 1 }, { unique: true });

// Create and export the TherapistBonus model
const TherapistBonusModel = mongoose.models.TherapistBonus || mongoose.model<ITherapistBonus>('TherapistBonus', TherapistBonusSchema);

export default TherapistBonusModel;