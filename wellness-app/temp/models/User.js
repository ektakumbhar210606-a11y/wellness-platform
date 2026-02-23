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
exports.UserRole = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Define the possible roles for a user
var UserRole;
(function (UserRole) {
    UserRole["Customer"] = "Customer";
    UserRole["Business"] = "Business";
    UserRole["Therapist"] = "Therapist";
})(UserRole || (exports.UserRole = UserRole = {}));
// Define the email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Define the phone validation regex (simplified for international numbers)
const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
// Define the User schema
const UserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true, // This creates an index
        trim: true,
        lowercase: true,
        maxlength: [255, 'Email cannot exceed 255 characters'],
        validate: {
            validator: (value) => emailRegex.test(value),
            message: 'Please provide a valid email address'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't return the password by default when querying
    },
    role: {
        type: String,
        enum: {
            values: Object.values(UserRole),
            message: 'Role must be either Customer, Business, or Therapist'
        },
        default: UserRole.Customer
    },
    phone: {
        type: String,
        trim: true,
        validate: {
            validator: (value) => !value || phoneRegex.test(value),
            message: 'Please provide a valid phone number'
        }
    },
    resetPasswordToken: {
        type: String,
        select: false // Don't return this field by default
    },
    resetPasswordExpires: {
        type: Date
    },
    rewardPoints: {
        type: Number,
        default: 0,
        min: [0, 'Reward points cannot be negative']
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});
// Create and export the User model
const UserModel = mongoose_1.default.models.User || mongoose_1.default.model('User', UserSchema);
exports.default = UserModel;
