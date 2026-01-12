import mongoose, { Document, Schema } from 'mongoose';
// User import not needed as we only need the ObjectId reference

export interface ITherapistProfile extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phoneNumber: string;
  professionalTitle: string;
  bio?: string;
  experience: number;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  skills: string[];
  certifications: string[];
  licenseNumber: string;
  weeklyAvailability: {
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    startTime: string;
    endTime: string;
  }[];
  status: 'pending' | 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const therapistProfileSchema = new Schema<ITherapistProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
  },
  professionalTitle: {
    type: String,
    required: [true, 'Professional title is required'],
  },
  bio: {
    type: String,
  },
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: [0, 'Experience cannot be negative'],
  },
  location: {
    city: String,
    state: String,
    country: String,
  },
  skills: [{
    type: String,
  }],
  certifications: [{
    type: String,
  }],
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
  },
  weeklyAvailability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Ensure userId is unique
therapistProfileSchema.index({ userId: 1 }, { unique: true });

export const TherapistProfile = mongoose.models.TherapistProfile || 
  mongoose.model<ITherapistProfile>('TherapistProfile', therapistProfileSchema);