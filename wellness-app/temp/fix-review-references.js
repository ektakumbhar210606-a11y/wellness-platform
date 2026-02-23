"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("./lib/db");
const Review_1 = __importDefault(require("./models/Review"));
async function fixReviewTherapistReferences() {
    try {
        await (0, db_1.connectToDatabase)();
        console.log('Connected to database');
        // Get all reviews
        const reviews = await Review_1.default.find({}).populate('bookingId');
        console.log(`Found ${reviews.length} reviews`);
        let fixedCount = 0;
        for (const review of reviews) {
            // If the review has a booking reference, check if the therapist ID matches
            if (review.bookingId && review.bookingId.therapist) {
                const bookingTherapistUserId = review.bookingId.therapist.user;
                // If the review's therapist field doesn't match the booking's therapist user ID
                if (review.therapist.toString() !== bookingTherapistUserId.toString()) {
                    console.log(`Fixing review ${review._id}:`);
                    console.log(`  Old therapist ID: ${review.therapist}`);
                    console.log(`  Correct therapist user ID: ${bookingTherapistUserId}`);
                    // Update the review to use the correct therapist user ID
                    await Review_1.default.findByIdAndUpdate(review._id, {
                        therapist: bookingTherapistUserId
                    });
                    fixedCount++;
                }
            }
        }
        console.log(`\nFixed ${fixedCount} reviews with incorrect therapist references`);
    }
    catch (error) {
        console.error('Error fixing reviews:', error);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('Database connection closed');
    }
}
fixReviewTherapistReferences();
