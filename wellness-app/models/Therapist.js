const mongoose = require('mongoose');

// Define availability status values
const TherapistAvailability = {
  Available: 'available',
  Busy: 'busy',
  Offline: 'offline',
  OnLeave: 'on-leave'
};

// Define business association status values
const BusinessAssociationStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected'
};

// Define the Therapist schema
const TherapistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
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
  skills: {
    type: [String],
    required: [true, 'Skills are required'],
    validate: [
      {
        validator: function(skills) {
          return skills && skills.length > 0;
        },
        message: 'Therapist must have at least one skill'
      },
      {
        validator: function(skills) {
          if (!skills || skills.length === 0) return true;
          
          const VALID_SKILL_IDS = [
            'client_assessment_consultation', 'anatomy_physiology', 'manual_massage_techniques',
            'mindfulness_coaching', 'stress_reduction_techniques', 'communication_client_care',
            'hygiene_safety_management'
          ];
          
          return skills.every(item => VALID_SKILL_IDS.includes(item));
        },
        message: 'All skills must be from the predefined list of valid skills'
      }
    ]
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    set: function(value) {
      return value ? Math.round(value * 100) / 100 : value;
    }
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Average rating cannot be negative'],
    max: [5, 'Average rating cannot exceed 5']
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: [0, 'Total reviews cannot be negative']
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
      type: mongoose.Schema.Types.ObjectId,
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
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
  }],
  
  // Expertise information
  areaOfExpertise: {
    type: [String],
    validate: [
      {
        validator: function(areaOfExpertise) {
          if (!areaOfExpertise) return true;
          
          const VALID_EXPERTISE_IDS = [
            'swedish_massage', 'deep_tissue_massage', 'aromatherapy_massage', 'hot_stone_massage',
            'thai_massage', 'reflexology', 'head_neck_shoulder_massage', 'facial_treatments_basic',
            'facial_treatments_advanced', 'body_scrub_polishing', 'body_wrap_therapy', 'manicure_pedicure',
            'hair_spa_treatment', 'meditation_mindfulness', 'weight_management', 'stress_management',
            'detox_lifestyle', 'mental_wellness_counseling', 'sleep_improvement'
          ];
          
          return areaOfExpertise.every(item => VALID_EXPERTISE_IDS.includes(item));
        },
        message: 'All expertise selections must be from the predefined list'
      }
    ]
  },
  
  // Cancellation tracking fields
  monthlyCancelCount: {
    type: Number,
    default: 0
  },
  totalCancelCount: {
    type: Number,
    default: 0
  },
  cancelWarnings: {
    type: Number,
    default: 0
  },
  bonusPenaltyPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Bonus penalty percentage cannot be negative'],
    max: [100, 'Bonus penalty percentage cannot exceed 100']
  },
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create indexes for better query performance
TherapistSchema.index({ user: 1 }, { unique: true });
TherapistSchema.index({ business: 1 });
TherapistSchema.index({ skills: 1 });
TherapistSchema.index({ rating: 1 });
TherapistSchema.index({ availabilityStatus: 1 });
TherapistSchema.index({ 'associatedBusinesses.businessId': 1 });
TherapistSchema.index({ 'associatedBusinesses.status': 1 });
TherapistSchema.index({ monthlyCancelCount: 1 });
TherapistSchema.index({ totalCancelCount: 1 });
TherapistSchema.index({ bonusPenaltyPercentage: 1 });

// Create and export the Therapist model
const TherapistModel = mongoose.models.Therapist || mongoose.model('Therapist', TherapistSchema);

module.exports = TherapistModel;
