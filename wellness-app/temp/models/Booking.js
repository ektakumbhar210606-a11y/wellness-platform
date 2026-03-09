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
exports.BookingStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Define the possible status values for a booking
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["Pending"] = "pending";
    BookingStatus["TherapistConfirmed"] = "therapist_confirmed";
    BookingStatus["TherapistRejected"] = "therapist_rejected";
    BookingStatus["Confirmed"] = "confirmed";
    BookingStatus["Paid"] = "paid";
    BookingStatus["Completed"] = "completed";
    BookingStatus["Cancelled"] = "cancelled";
    BookingStatus["NoShow"] = "no-show";
    BookingStatus["Rescheduled"] = "rescheduled";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
// Define the time format validation regex (HH:MM format in 24-hour format)
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
// Define the Booking schema
const BookingSchema = new mongoose_1.Schema({
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Customer reference is required'],
    },
    therapist: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: [true, 'Therapist reference is required'],
    },
    service: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Service',
        required: [true, 'Service reference is required'],
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
    },
    time: {
        type: String,
        required: [true, 'Time is required'],
        validate: {
            validator: (value) => timeFormatRegex.test(value),
            message: 'Time must be in HH:MM format (24-hour)'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'therapist_confirmed', 'therapist_rejected', 'confirmed', 'paid', 'completed', 'cancelled', 'no-show', 'rescheduled', 'therapist_cancel_requested', 'cancelled_by_therapist'],
            message: 'Status must be either pending, therapist_confirmed, therapist_rejected, confirmed, paid, completed, cancelled, no-show, rescheduled, therapist_cancel_requested, or cancelled_by_therapist'
        },
        default: BookingStatus.Pending
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    duration: {
        type: Number,
        min: [1, 'Duration must be at least 1 minute']
    },
    assignedByAdmin: {
        type: Boolean,
        default: false // By default, bookings are not explicitly assigned by admin
    },
    assignedById: {
        type: String,
        ref: 'User' // Reference to the admin who assigned the booking
    },
    therapistResponded: {
        type: Boolean,
        default: false // By default, therapist has not responded
    },
    notificationDestination: {
        type: String,
        enum: ['customer', 'business'],
        default: 'customer' // By default, notifications go to customer
    },
    responseVisibleToBusinessOnly: {
        type: Boolean,
        default: false // By default, responses are visible to customer
    },
    originalDate: {
        type: Date, // Original booking date (for tracking reschedules)
        required: false
    },
    originalTime: {
        type: String, // Original booking time (for tracking reschedules)
        required: false
    },
    rescheduledBy: {
        type: String, // ID of the user who rescheduled the booking (therapist or business)
        required: false
    },
    rescheduledAt: {
        type: Date, // When the booking was rescheduled
        required: false
    },
    confirmedBy: {
        type: String, // ID of the user who confirmed the booking (therapist or business)
        required: false
    },
    confirmedAt: {
        type: Date, // When the booking was confirmed
        required: false
    },
    cancelledBy: {
        type: String, // ID of the user who cancelled the booking (therapist or business)
        required: false
    },
    cancelledAt: {
        type: Date, // When the booking was cancelled
        required: false
    },
    cancelReason: {
        type: String, // Reason for cancellation (therapist or business)
        required: false
    },
    therapistCancelReason: {
        type: String, // Specific reason provided by therapist for cancel request
        required: false
    },
    therapistCancelRequestedAt: {
        type: Date, // When therapist requested cancellation
        required: false
    },
    businessReviewStatus: {
        type: String, // Business review status for therapist cancel request
        enum: ['pending', 'approved', 'rejected'],
        required: false
    },
    businessReviewedAt: {
        type: Date, // When business reviewed the cancel request
        required: false
    },
    completedAt: {
        type: Date, // When the booking was completed
        required: false
    },
    reviewSubmitted: {
        type: Boolean, // Whether a review has been submitted for this booking
        default: false
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'paid'],
        default: 'pending'
    },
    therapistPayoutStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },
    therapistPayoutAmount: {
        type: Number,
        required: false
    },
    therapistPaidAt: {
        type: Date,
        required: false
    },
    paymentVerification: {
        orderId: {
            type: String,
            required: false
        },
        paymentId: {
            type: String,
            required: false
        },
        signature: {
            type: String,
            required: false
        },
        verifiedAt: {
            type: Date,
            required: false
        }
    },
    therapistPayoutOrderInfo: {
        orderId: {
            type: String,
            required: false
        },
        amount: {
            type: Number,
            required: false
        },
        currency: {
            type: String,
            required: false
        },
        created_at: {
            type: Date,
            required: false
        }
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});
// Create indexes for better query performance
BookingSchema.index({ customer: 1 }); // Index on customer for quick lookups by customer
BookingSchema.index({ therapist: 1 }); // Index on therapist for quick lookups by therapist
BookingSchema.index({ service: 1 }); // Index on service for quick lookups by service
BookingSchema.index({ date: 1 }); // Index on date for date-based queries
BookingSchema.index({ status: 1 }); // Index on status for filtering by status
BookingSchema.index({ customer: 1, date: 1 }); // Compound index for customer-date queries
BookingSchema.index({ therapist: 1, date: 1 }); // Compound index for therapist-date queries
// Create and export the Booking model
const BookingModel = mongoose_1.default.models.Booking || mongoose_1.default.model('Booking', BookingSchema);
exports.default = BookingModel;
