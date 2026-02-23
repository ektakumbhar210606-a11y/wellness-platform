"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessAssociationStatus = exports.TherapistAvailability = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Define the possible availability status values for a therapist
var TherapistAvailability;
(function (TherapistAvailability) {
    TherapistAvailability["Available"] = "available";
    TherapistAvailability["Busy"] = "busy";
    TherapistAvailability["Offline"] = "offline";
    TherapistAvailability["OnLeave"] = "on-leave";
})(TherapistAvailability || (exports.TherapistAvailability = TherapistAvailability = {}));
// Define the possible association status values for business associations
var BusinessAssociationStatus;
(function (BusinessAssociationStatus) {
    BusinessAssociationStatus["Pending"] = "pending";
    BusinessAssociationStatus["Approved"] = "approved";
    BusinessAssociationStatus["Rejected"] = "rejected";
})(BusinessAssociationStatus || (exports.BusinessAssociationStatus = BusinessAssociationStatus = {}));
// Define the Therapist schema
const TherapistSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    business: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: [String], // Array of strings
        required: [true, 'Skills are required'],
        validate: [
            {
                validator: function (skills) {
                    return skills && skills.length > 0;
                },
                message: 'Therapist must have at least one skill'
            },
            {
                validator: function (skills) {
                    // Ensure all skills are valid skill IDs from the master list
                    if (!skills || skills.length === 0)
                        return true;
                    // Hardcoded valid skill IDs from skills_master
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
        set: function (value) {
            // Round to 2 decimal places if provided
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
                type: mongoose_1.Schema.Types.ObjectId,
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
                validator: function (areaOfExpertise) {
                    // Ensure all expertise IDs are valid
                    if (!areaOfExpertise)
                        return true; // Allow undefined/empty
                    // Since this is a server-side validation, we need to load the constants differently
                    // We'll use a static import at the top of the file to avoid dynamic imports in validators
                    // For now, we'll reference a hardcoded list or use the preloaded constants
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
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});
// Create indexes for better query performance
TherapistSchema.index({ user: 1 }, { unique: true }); // Unique index on user for preventing duplicate therapist profiles
TherapistSchema.index({ business: 1 }); // Index on business for quick lookups by business
TherapistSchema.index({ skills: 1 }); // Index on skills for searching by specialization
TherapistSchema.index({ rating: 1 }); // Index on rating for sorting/filtering
TherapistSchema.index({ availabilityStatus: 1 }); // Index on availability status for filtering
TherapistSchema.index({ 'associatedBusinesses.businessId': 1 }); // Index on associated businesses for marketplace queries
TherapistSchema.index({ 'associatedBusinesses.status': 1 }); // Index on association status for filtering
// Create and export the Therapist model
const TherapistModel = mongoose_1.default.models.Therapist || mongoose_1.default.model('Therapist', TherapistSchema);
exports.default = TherapistModel;
