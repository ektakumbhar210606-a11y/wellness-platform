import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User'; // Import the User interface

// Define the possible customer preference types
export enum CustomerPreferenceType {
  Service = 'service',
  Therapy = 'therapy',
  Lifestyle = 'lifestyle',
  Goal = 'goal'
}

// Define the possible stress level values
export enum StressLevel {
  Low = 'low',
  Moderate = 'moderate',
  High = 'high',
  VeryHigh = 'very-high'
}

// Define the possible frequency values
export enum AppointmentFrequency {
  Weekly = 'weekly',
  BiWeekly = 'bi-weekly',
  Monthly = 'monthly',
  Occasional = 'occasional',
  FirstTime = 'first-time'
}

// Define the interface for customer preferences
export interface ICustomerPreference {
  type: CustomerPreferenceType;
  value: string;
  category?: string; // e.g., 'massage', 'spa', 'wellness'
}

// Define the interface for customer goals
export interface ICustomerGoal {
  title: string;
  description: string;
  targetDate?: Date;
  progress: number; // 0-100
  completed: boolean;
  createdAt: Date;
}

// Define the interface for customer wellness history
export interface ICustomerWellnessHistory {
  serviceId: mongoose.Types.ObjectId;
  serviceName: string;
  therapistId?: mongoose.Types.ObjectId;
  therapistName?: string;
  businessId?: mongoose.Types.ObjectId;
  businessName?: string;
  date: Date;
  rating?: number;
  notes?: string;
  tags?: string[];
}

// Define the interface for customer medical information
export interface ICustomerMedicalInfo {
  conditions: string[];
  allergies: string[];
  medications: string[];
  notes?: string;
  lastUpdated: Date;
}

// Define the interface for the Customer document
export interface ICustomer extends Document {
  user: IUser['_id'] | IUser; // Reference to User model (userId)
  
  // Basic profile information
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: string;
  
  // Location information
  location?: {
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  
  // Onboarding information
  onboardingCompleted: boolean;
  onboardingCompletedAt?: Date;
  
  // Preferences
  preferences: ICustomerPreference[];
  preferredTherapies: string[];
  appointmentFrequency?: AppointmentFrequency;
  preferredTimeSlots?: string[]; // e.g., ['morning', 'afternoon', 'evening']
  
  // Wellness goals
  wellnessGoals: string;
  wellnessGoalsList: ICustomerGoal[];
  stressLevel?: StressLevel;
  lifestyleFactors: string[];
  
  // Medical information
  medicalInfo: ICustomerMedicalInfo;
  
  // Wellness history
  wellnessHistory: ICustomerWellnessHistory[];
  
  // Engagement metrics
  totalAppointments: number;
  totalServicesUsed: number;
  avgRating: number;
  favoriteTherapists: mongoose.Types.ObjectId[];
  favoriteServices: mongoose.Types.ObjectId[];
  
  // Communication preferences
  communicationPreferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
  };
  
  // Privacy settings
  privacySettings: {
    profileVisibility: 'public' | 'private' | 'friends';
    appointmentHistoryVisibility: 'public' | 'private' | 'friends';
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Define the Customer schema
const CustomerSchema: Schema<ICustomer> = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true // Each user can have only one customer profile
  },
  
  // Basic profile information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phoneNumber: {
    type: String,
    trim: true,
    // Temporarily make phone number optional for debugging
    // match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'],
    // required: [true, 'Phone number is required']
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(dob: Date) {
        return !dob || dob < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  
  // Location information
  location: {
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Onboarding information
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  onboardingCompletedAt: {
    type: Date
  },
  
  // Preferences
  preferences: [{
    type: {
      type: String,
      enum: Object.values(CustomerPreferenceType),
      required: false
    },
    value: {
      type: String,
      trim: true,
      required: false
    },
    category: {
      type: String,
      required: false
    }
  }],
  preferredTherapies: [{
    type: String,
    trim: true,
    required: false
  }],
  appointmentFrequency: {
    type: String,
    enum: Object.values(AppointmentFrequency)
  },
  preferredTimeSlots: [{
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'weekend']
  }],
  
  // Wellness goals
  wellnessGoals: {
    type: String,
    // Temporarily make wellness goals optional for debugging
    // required: [true, 'Wellness goals are required'],
    trim: true,
    maxlength: [1000, 'Wellness goals cannot exceed 1000 characters']
  },
  wellnessGoalsList: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    targetDate: Date,
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completed: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  stressLevel: {
    type: String,
    enum: Object.values(StressLevel)
  },
  lifestyleFactors: [{
    type: String,
    trim: true,
    required: false
  }],
  
  // Medical information
  medicalInfo: {
    conditions: [{
      type: String,
      trim: true
    }],
    allergies: [{
      type: String,
      trim: true
    }],
    medications: [{
      type: String,
      trim: true
    }],
    notes: {
      type: String,
      trim: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Wellness history
  wellnessHistory: [{
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service'
    },
    serviceName: String,
    therapistId: {
      type: Schema.Types.ObjectId,
      ref: 'Therapist'
    },
    therapistName: String,
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business'
    },
    businessName: String,
    date: {
      type: Date,
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String,
    tags: [String]
  }],
  
  // Engagement metrics
  totalAppointments: {
    type: Number,
    default: 0,
    min: 0
  },
  totalServicesUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  avgRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  favoriteTherapists: [{
    type: Schema.Types.ObjectId,
    ref: 'Therapist'
  }],
  favoriteServices: [{
    type: Schema.Types.ObjectId,
    ref: 'Service'
  }],
  
  // Communication preferences
  communicationPreferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    marketingEmails: {
      type: Boolean,
      default: false
    }
  },
  
  // Privacy settings
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'private'
    },
    appointmentHistoryVisibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'private'
    }
  }
  
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Indexes for better query performance
CustomerSchema.index({ user: 1 });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ 'preferences.type': 1, 'preferences.value': 1 });
CustomerSchema.index({ 'preferredTherapies': 1 });
CustomerSchema.index({ 'location.city': 1, 'location.state': 1 });
CustomerSchema.index({ 'wellnessGoalsList.completed': 1 });
CustomerSchema.index({ totalAppointments: 1 });
CustomerSchema.index({ avgRating: 1 });
CustomerSchema.index({ 'wellnessHistory.date': -1 }); // Recent history first

// Pre-save middleware to update onboarding completion timestamp
CustomerSchema.pre('save', function() {
  if (this.isModified('onboardingCompleted') && this.onboardingCompleted && !this.onboardingCompletedAt) {
    this.onboardingCompletedAt = new Date();
  }
});

// Virtual for age calculation
CustomerSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Method to add a wellness history entry
CustomerSchema.methods.addWellnessHistory = async function(historyEntry: any) {
  this.wellnessHistory.push(historyEntry);
  this.totalAppointments += 1;
  this.totalServicesUsed += 1;
  await this.save();
};

// Method to update wellness goal progress
CustomerSchema.methods.updateGoalProgress = async function(goalId: string, progress: number) {
  const goal = this.wellnessGoalsList.id(goalId);
  if (goal) {
    goal.progress = progress;
    goal.completed = progress >= 100;
    await this.save();
  }
};

// Method to add a favorite therapist
CustomerSchema.methods.addFavoriteTherapist = async function(therapistId: mongoose.Types.ObjectId) {
  if (!this.favoriteTherapists.includes(therapistId)) {
    this.favoriteTherapists.push(therapistId);
    await this.save();
  }
};

// Method to remove a favorite therapist
CustomerSchema.methods.removeFavoriteTherapist = async function(therapistId: mongoose.Types.ObjectId) {
  this.favoriteTherapists = this.favoriteTherapists.filter(
    (id: mongoose.Types.ObjectId) => !id.equals(therapistId)
  );
  await this.save();
};

// Create and export the Customer model
const CustomerModel = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export default CustomerModel;