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
exports.TherapistAssociationStatus = exports.ServiceType = exports.BusinessStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Define the possible status values for a business
var BusinessStatus;
(function (BusinessStatus) {
    BusinessStatus["Active"] = "active";
    BusinessStatus["Inactive"] = "inactive";
    BusinessStatus["Suspended"] = "suspended";
})(BusinessStatus || (exports.BusinessStatus = BusinessStatus = {}));
// Define the possible service types for a business
var ServiceType;
(function (ServiceType) {
    ServiceType["Massage"] = "massage";
    ServiceType["Spa"] = "spa";
    ServiceType["Wellness"] = "wellness";
    ServiceType["Corporate"] = "corporate";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
// Define the possible therapist association status values
var TherapistAssociationStatus;
(function (TherapistAssociationStatus) {
    TherapistAssociationStatus["Pending"] = "pending";
    TherapistAssociationStatus["Approved"] = "approved";
})(TherapistAssociationStatus || (exports.TherapistAssociationStatus = TherapistAssociationStatus = {}));
// Define the time format validation regex (HH:MM format)
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
// Define the Business schema
const BusinessSchema = new mongoose_1.Schema({
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Owner is required'],
    },
    name: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true,
        maxlength: [100, 'Business name cannot exceed 100 characters'],
        validate: {
            validator: (value) => {
                // Basic validation for business name (alphanumeric, spaces, hyphens, apostrophes)
                const businessNameRegex = /^[a-zA-Z0-9\s\-\'\.]+$/;
                return businessNameRegex.test(value);
            },
            message: 'Please provide a valid business name'
        }
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Business description cannot exceed 500 characters']
    },
    serviceType: {
        type: String,
        enum: {
            values: Object.values(ServiceType),
            message: 'Service type must be one of: massage, spa, wellness, corporate'
        }
    },
    serviceName: {
        type: String,
        trim: true,
        maxlength: [100, 'Service name cannot exceed 100 characters']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'],
        maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        maxlength: [100, 'Email cannot exceed 100 characters']
    },
    website: {
        type: String,
        trim: true,
        match: [/^https?:\/\/[^\s/$.?#].[^\s]*$/i, 'Please provide a valid website URL'],
        maxlength: [200, 'Website URL cannot exceed 200 characters']
    },
    address: {
        street: {
            type: String,
            required: [true, 'Street address is required'],
            trim: true,
            maxlength: [200, 'Street address cannot exceed 200 characters']
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true,
            maxlength: [50, 'City cannot exceed 50 characters']
        },
        state: {
            type: String,
            required: [true, 'State is required'],
            trim: true,
            maxlength: [50, 'State cannot exceed 50 characters']
        },
        zipCode: {
            type: String,
            required: [true, 'Zip code is required'],
            trim: true,
            maxlength: [20, 'Zip code cannot exceed 20 characters']
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
            trim: true,
            maxlength: [50, 'Country cannot exceed 50 characters']
        },
        currency: {
            type: String,
            trim: true,
            maxlength: [3, 'Currency code cannot exceed 3 characters'],
            default: 'INR' // Default to INR
        }
    },
    openingTime: {
        type: String,
        required: [true, 'Opening time is required'],
        validate: {
            validator: (value) => timeFormatRegex.test(value),
            message: 'Please provide a valid opening time in HH:MM format (24-hour)'
        }
    },
    closingTime: {
        type: String,
        required: [true, 'Closing time is required'],
        validate: {
            validator: (value) => timeFormatRegex.test(value),
            message: 'Please provide a valid closing time in HH:MM format (24-hour)'
        }
    },
    businessHours: {
        Monday: {
            open: String,
            close: String,
            closed: Boolean
        },
        Tuesday: {
            open: String,
            close: String,
            closed: Boolean
        },
        Wednesday: {
            open: String,
            close: String,
            closed: Boolean
        },
        Thursday: {
            open: String,
            close: String,
            closed: Boolean
        },
        Friday: {
            open: String,
            close: String,
            closed: Boolean
        },
        Saturday: {
            open: String,
            close: String,
            closed: Boolean
        },
        Sunday: {
            open: String,
            close: String,
            closed: Boolean
        }
    },
    status: {
        type: String,
        enum: {
            values: Object.values(BusinessStatus),
            message: 'Status must be either active, inactive, or suspended'
        },
        default: BusinessStatus.Active
    },
    currency: {
        type: String,
        trim: true,
        maxlength: [3, 'Currency code cannot exceed 3 characters'],
        default: 'INR' // Default to INR
    },
    therapists: [{
            therapistId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Therapist',
                required: true
            },
            status: {
                type: String,
                enum: {
                    values: Object.values(TherapistAssociationStatus),
                    message: 'Therapist association status must be pending or approved'
                },
                default: TherapistAssociationStatus.Pending
            },
            joinedAt: {
                type: Date
            }
        }]
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});
// Create indexes for better query performance
BusinessSchema.index({ owner: 1 }); // Index on owner for quick lookups
BusinessSchema.index({ name: 'text' }); // Text index for business name search
BusinessSchema.index({ 'address.city': 1 }); // Index on city for location-based queries
BusinessSchema.index({ status: 1 }); // Index on status for filtering
BusinessSchema.index({ serviceType: 1 }); // Index on service type for filtering
BusinessSchema.index({ 'therapists.therapistId': 1 }); // Index on therapist associations for marketplace queries
// Create and export the Business model
const BusinessModel = mongoose_1.default.models.Business || mongoose_1.default.model('Business', BusinessSchema);
exports.default = BusinessModel;
