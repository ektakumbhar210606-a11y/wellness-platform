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
const mongoose_1 = __importStar(require("mongoose"));
// Define the Service schema
const ServiceSchema = new mongoose_1.Schema({
    business: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Business',
        required: [true, 'Business reference is required'],
    },
    serviceCategory: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ServiceCategory',
        required: [true, 'Service category is required'],
    },
    name: {
        type: String,
        required: [true, 'Service name is required'],
        trim: true,
        maxlength: [200, 'Service name cannot exceed 200 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 minute']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    therapists: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Therapist'
        }],
    teamMembers: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Therapist'
        }]
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});
// Create indexes for better query performance
ServiceSchema.index({ business: 1 }); // Index on business for quick lookups by business
ServiceSchema.index({ serviceCategory: 1 }); // Index on serviceCategory for filtering
ServiceSchema.index({ price: 1 }); // Index on price for sorting/filtering
ServiceSchema.index({ duration: 1 }); // Index on duration for sorting/filtering
ServiceSchema.index({ therapists: 1 }); // Index on therapists for marketplace queries
ServiceSchema.index({ teamMembers: 1 }); // Index on team members for marketplace queries
// Create and export the Service model
const ServiceModel = mongoose_1.default.models.Service || mongoose_1.default.model('Service', ServiceSchema);
exports.default = ServiceModel;
