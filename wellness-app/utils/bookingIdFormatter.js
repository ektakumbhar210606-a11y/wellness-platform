"use strict";
/**
 * Utility functions for formatting booking IDs for user-friendly display
 * while preserving internal MongoDB IDs for backend operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatBookingId = formatBookingId;
exports.getInternalBookingId = getInternalBookingId;
exports.clearBookingIdCache = clearBookingIdCache;
exports.initializeBookingIds = initializeBookingIds;
exports.getAllBookingIdMappings = getAllBookingIdMappings;
// For production environments, we'll use a more persistent approach
// For simplicity in this implementation, we'll use an in-memory cache
// In a real production environment, you'd likely want to store this in a database
const bookingIdCache = new Map();
let currentBookingCounter = 0;
// Initialize counter from existing mappings
function initializeCounter() {
    if (bookingIdCache.size > 0) {
        const maxId = Math.max(...Array.from(bookingIdCache.values()).map(id => parseInt(id.substring(1))));
        currentBookingCounter = maxId > 0 ? maxId : 0;
    }
}
/**
 * Convert MongoDB ObjectId to user-friendly format (b1, b2, b3, etc.)
 * @param internalId - The original MongoDB ObjectId string
 * @returns User-friendly booking ID (e.g., "b1", "b2", "b3")
 */
function formatBookingId(internalId) {
    // Check if we already have a mapping for this ID
    if (bookingIdCache.has(internalId)) {
        return bookingIdCache.get(internalId);
    }
    // Generate new sequential ID
    currentBookingCounter++;
    const displayId = `b${currentBookingCounter}`;
    // Store mapping
    bookingIdCache.set(internalId, displayId);
    return displayId;
}
/**
 * Get internal MongoDB ID from user-friendly display ID
 * @param displayId - The user-friendly booking ID (e.g., "b1", "b2")
 * @returns Original MongoDB ObjectId string, or null if not found
 */
function getInternalBookingId(displayId) {
    // Search through cache for matching display ID
    for (const [internalId, cachedDisplayId] of bookingIdCache.entries()) {
        if (cachedDisplayId === displayId) {
            return internalId;
        }
    }
    return null;
}
/**
 * Clear the booking ID cache (useful for testing or when resetting)
 */
function clearBookingIdCache() {
    bookingIdCache.clear();
    currentBookingCounter = 0;
}
/**
 * Pre-populate cache with existing bookings (useful for initialization)
 * @param bookingIds - Array of existing MongoDB booking IDs
 */
function initializeBookingIds(bookingIds) {
    // Clear existing cache
    clearBookingIdCache();
    // Initialize with provided IDs, assigning them sequential display IDs
    bookingIds.forEach((id, index) => {
        bookingIdCache.set(id, `b${index + 1}`);
    });
    // Set counter to the highest number to continue from there
    currentBookingCounter = bookingIds.length;
}
/**
 * Get all booking ID mappings (for debugging purposes)
 * @returns Map of internal IDs to display IDs
 */
function getAllBookingIdMappings() {
    return new Map(bookingIdCache);
}
