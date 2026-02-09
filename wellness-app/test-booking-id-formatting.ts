/**
 * Test script to verify booking ID formatting functionality
 */

import { formatBookingId, getInternalBookingId, clearBookingIdCache, initializeBookingIds } from './utils/bookingIdFormatter';

console.log('=== Testing Booking ID Formatting ===\n');

// Clear cache to start fresh
clearBookingIdCache();

// Test 1: Basic formatting
console.log('Test 1: Basic formatting');
const testId1 = '6985c473163a4997c2cbe137';
const displayId1 = formatBookingId(testId1);
console.log(`Internal ID: ${testId1} -> Display ID: ${displayId1}`);
console.log(`Expected: b1, Actual: ${displayId1}, Pass: ${displayId1 === 'b1'}\n`);

// Test 2: Second ID formatting
console.log('Test 2: Second ID formatting');
const testId2 = '6985c473163a4997c2cbe138';
const displayId2 = formatBookingId(testId2);
console.log(`Internal ID: ${testId2} -> Display ID: ${displayId2}`);
console.log(`Expected: b2, Actual: ${displayId2}, Pass: ${displayId2 === 'b2'}\n`);

// Test 3: Repeated call returns same result
console.log('Test 3: Consistency check');
const displayId1Again = formatBookingId(testId1);
console.log(`Internal ID: ${testId1} -> Display ID: ${displayId1Again}`);
console.log(`Expected: b1, Actual: ${displayId1Again}, Pass: ${displayId1Again === 'b1'}, Consistent: ${displayId1 === displayId1Again}\n`);

// Test 4: Reverse lookup
console.log('Test 4: Reverse lookup');
const internalIdFromDisplay = getInternalBookingId(displayId1);
console.log(`Display ID: ${displayId1} -> Internal ID: ${internalIdFromDisplay}`);
console.log(`Expected: ${testId1}, Actual: ${internalIdFromDisplay}, Pass: ${internalIdFromDisplay === testId1}\n`);

// Test 5: Initialize with existing IDs
console.log('Test 5: Initialize with existing IDs');
clearBookingIdCache();
const existingIds = ['existing1', 'existing2', 'existing3'];
initializeBookingIds(existingIds);

// Check if initialized correctly
const existingDisplay1 = formatBookingId('existing1');
const existingDisplay2 = formatBookingId('existing2');
const existingDisplay3 = formatBookingId('existing3');
console.log(`Initialized existing1 -> ${existingDisplay1} (expected: b1)`);
console.log(`Initialized existing2 -> ${existingDisplay2} (expected: b2)`);
console.log(`Initialized existing3 -> ${existingDisplay3} (expected: b3)`);

// Check that next ID continues sequence
const newId = 'newId';
const newDisplayId = formatBookingId(newId);
console.log(`Next new ID: ${newId} -> ${newDisplayId} (expected: b4)`);
console.log(`Pass: ${newDisplayId === 'b4'}\n`);

console.log('=== All Tests Completed ===');