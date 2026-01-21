import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User'; // Import the User interface
import { IBusiness } from './Business'; // Import the Business interface

// Define the possible availability status values for a therapist
export enum TherapistAvailability {
  Available = 'available',
  Busy = 'busy',
  Offline = 'offline',
  OnLeave = 'on-leave'
}

// Define the possible association status values for business associations
export enum BusinessAssociationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected'
}

// Define the interface for business association
export interface IBusinessAssociation {
  businessId: mongoose.Types.ObjectId;
  status: BusinessAssociationStatus;
  requestedAt: Date;
  approvedAt?: Date;
}

// Define the interface for the Therapist document
export interface ITherapist extends Document {
  user: IUser['_id'] | IUser; // Reference to User model (userId)
  business: IBusiness['_id'] | IBusiness; // Reference to Business model (can be null initially)
  experience: number; // Years of experience
  expertise: string[]; // Array of therapy specializations
  rating?: number; // Average customer rating (0-5)
  availabilityStatus: TherapistAvailability; // Current availability status
  associatedBusinesses?: IBusinessAssociation[]; // Array of business associations
  
  // Profile information
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  professionalTitle?: string;
  bio?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  certifications?: string[];
  licenseNumber?: string;
  weeklyAvailability?: Array<{
    day: string;
    available: boolean;
    startTime?: string;
    endTime?: string;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

// Define the Therapist schema
const TherapistSchema: Schema<ITherapist> = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
  },
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: [0, 'Experience cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Experience must be a whole number'
    }
  },
  expertise: {
    type: [String], // Array of strings
    required: [true, 'Expertise is required'],
    validate: [
      {
        validator: function(expertise: string[]) {
          return expertise && expertise.length > 0;
        },
        message: 'Therapist must have at least one area of expertise'
      },
      {
        validator: function(expertise: string[]) {
          // Ensure all expertise strings are valid (not empty after trimming)
          return expertise.every(item => item.trim().length > 0);
        },
        message: 'All expertise items must be non-empty strings'
      }
    ]
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    set: function(value: number) {
      // Round to 2 decimal places if provided
      return value ? Math.round(value * 100) / 100 : value;
    }
  },
  availabilityStatus: {
    type: String,
    enum: {
      values: Object.values(TherapistAvailability),
      message: 'Availability status must be either available, busy, offline, or on-leave'
    },
    default: TherapistAvailability.Available
  },
  associatedBusinesses: [{
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true
    },
    status: {
      type: String,
      enum: {
        values: Object.values(BusinessAssociationStatus),
        message: 'Business association status must be pending, approved, or rejected'
      },
      default: BusinessAssociationStatus.Pending
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    approvedAt: {
      type: Date
    }
  }],
  
  // Profile information
  fullName: {
    type: String,
  },
  email: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  professionalTitle: {
    type: String,
  },
  bio: {
    type: String,
  },
  location: {
    city: String,
    state: String,
    country: String,
  },
  certifications: {
    type: [String],
  },
  licenseNumber: {
    type: String,
  },
  weeklyAvailability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    available: Boolean,
    startTime: String,
    endTime: String,
  }],
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create indexes for better query performance
TherapistSchema.index({ user: 1 }, { unique: true }); // Unique index on user for preventing duplicate therapist profiles
TherapistSchema.index({ business: 1 }); // Index on business for quick lookups by business
TherapistSchema.index({ expertise: 1 }); // Index on expertise for searching by specialization
TherapistSchema.index({ rating: 1 }); // Index on rating for sorting/filtering
TherapistSchema.index({ availabilityStatus: 1 }); // Index on availability status for filtering
TherapistSchema.index({ 'associatedBusinesses.businessId': 1 }); // Index on associated businesses for marketplace queries
TherapistSchema.index({ 'associatedBusinesses.status': 1 }); // Index on association status for filtering

// Create and export the Therapist model
const TherapistModel = mongoose.models.Therapist || mongoose.model<ITherapist>('Therapist', TherapistSchema);

export default TherapistModel;