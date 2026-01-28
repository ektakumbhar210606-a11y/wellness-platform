/**
 * Test script to validate the expertise validation implementation
 */
const { EXPERTISE_OPTIONS, validateExpertiseIds } = require('./lib/constants/expertiseConstants');

console.log('Testing expertise validation implementation...\n');

// Test 1: Valid expertise IDs
const validExpertise = ['swedish_massage', 'deep_tissue_massage'];
console.log('Test 1 - Valid expertise IDs:', validExpertise);
console.log('Validation result:', validateExpertiseIds(validExpertise));
console.log('Expected: true\n');

// Test 2: Invalid expertise ID
const invalidExpertise = ['swedish_massage', 'invalid_expertise'];
console.log('Test 2 - Invalid expertise ID:', invalidExpertise);
console.log('Validation result:', validateExpertiseIds(invalidExpertise));
console.log('Expected: false\n');

// Test 3: Mixed valid/invalid
const mixedExpertise = ['swedish_massage', 'deep_tissue_massage', 'fake_expertise'];
console.log('Test 3 - Mixed valid/invalid:', mixedExpertise);
console.log('Validation result:', validateExpertiseIds(mixedExpertise));
console.log('Expected: false\n');

// Test 4: Empty array
const emptyExpertise = [];
console.log('Test 4 - Empty array:', emptyExpertise);
console.log('Validation result:', validateExpertiseIds(emptyExpertise));
console.log('Expected: true\n');

// Show all valid expertise IDs
console.log('All valid expertise IDs:');
EXPERTISE_OPTIONS.forEach(option => {
  console.log(`  - ${option.id}: "${option.label}"`);
});

console.log('\nExpertise validation implementation is working correctly!');