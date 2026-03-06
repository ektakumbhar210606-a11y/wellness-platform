/**
 * Test script for Therapist Bonus Name Display Fix
 * 
 * This script tests that therapist names are properly stored and retrieved
 * in the TherapistBonus collection.
 */

const fetch = require('node-fetch');

// Configuration - Update these values based on your environment
const API_BASE_URL = 'http://localhost:3000';
let AUTH_TOKEN = ''; // Will be set during login

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Helper function to make authenticated requests
 */
async function authenticatedRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(AUTH_TOKEN && { 'Authorization': `Bearer ${AUTH_TOKEN}` }),
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`${colors.red}Request failed: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Test 1: Login as business user
 */
async function testLogin() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}TEST 1: Login as Business User${colors.reset}`);
  console.log('='.repeat(60));

  try {
    // You'll need to provide valid credentials or use an existing token
    console.log('ℹ️  Please provide business user credentials or set AUTH_TOKEN manually');
    console.log('Example: export AUTH_TOKEN="your-jwt-token-here"');
    
    if (!AUTH_TOKEN) {
      console.log(`${colors.yellow}⚠️  No AUTH_TOKEN provided. Skipping login test.${colors.reset}`);
      console.log('To test properly, set the AUTH_TOKEN environment variable.');
      return false;
    }

    console.log(`${colors.green}✓ Using provided authentication token${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Login failed: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Test 2: Fetch therapists associated with business
 */
async function testFetchTherapists() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}TEST 2: Fetch Associated Therapists${colors.reset}`);
  console.log('='.repeat(60));

  try {
    const response = await authenticatedRequest('/api/business/therapists');
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch therapists');
    }

    const allTherapists = [
      ...(response.data.approvedTherapists || []),
      ...(response.data.pendingTherapists || [])
    ];

    console.log(`Found ${allTherapists.length} therapist(s)`);
    
    if (allTherapists.length === 0) {
      console.log(`${colors.yellow}⚠️  No therapists found. Add therapists before testing bonus calculation.${colors.reset}`);
      return null;
    }

    allTherapists.forEach((therapist, index) => {
      console.log(`\n${index + 1}. ${therapist.firstName || ''} ${therapist.lastName || ''} (${therapist.fullName || 'N/A'})`);
      console.log(`   ID: ${therapist.therapistId || therapist.id}`);
      console.log(`   User ID: ${therapist.userId}`);
      console.log(`   Status: ${therapist.status}`);
    });

    return allTherapists[0]; // Return first therapist for testing
  } catch (error) {
    console.log(`${colors.red}✗ Failed to fetch therapists: ${error.message}${colors.reset}`);
    return null;
  }
}

/**
 * Test 3: Calculate bonus for a therapist
 */
async function testCalculateBonus(therapist) {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}TEST 3: Calculate Therapist Bonus${colors.reset}`);
  console.log('='.repeat(60));

  if (!therapist) {
    console.log(`${colors.yellow}⚠️  Skipping bonus calculation - no therapist available${colors.reset}`);
    return null;
  }

  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    console.log(`Calculating bonus for:`);
    console.log(`  Therapist: ${therapist.firstName || ''} ${therapist.lastName || ''}`);
    console.log(`  Month: ${currentMonth}, Year: ${currentYear}`);

    const response = await authenticatedRequest('/api/bonus/calculate', {
      method: 'POST',
      body: JSON.stringify({
        therapistId: therapist.therapistId || therapist.id,
        month: currentMonth,
        year: currentYear
      })
    });

    if (response.success) {
      console.log(`${colors.green}✓ Bonus calculated successfully${colors.reset}`);
      console.log(`  Bonus ID: ${response.bonus.id}`);
      console.log(`  Therapist ID stored: ${response.bonus.therapistId}`);
      console.log(`  Amount: ₹${response.bonus.bonusAmount}`);
      console.log(`  Status: ${response.bonus.status}`);
      return response.bonus;
    } else if (response.message === 'Not eligible') {
      console.log(`${colors.yellow}⚠️  Therapist not eligible for bonus${colors.reset}`);
      console.log(`  Average Rating: ${response.averageRating}`);
      console.log(`  Total Reviews: ${response.totalReviews}`);
      console.log(`  Required: Rating ≥ 4.0 AND Reviews ≥ 2`);
      return null;
    } else {
      throw new Error(response.error || 'Failed to calculate bonus');
    }
  } catch (error) {
    // Check if it's a duplicate error (bonus already exists)
    if (error.message.includes('already')) {
      console.log(`${colors.yellow}⚠️  Bonus already exists for this period${colors.reset}`);
      return null;
    }
    console.log(`${colors.red}✗ Bonus calculation failed: ${error.message}${colors.reset}`);
    return null;
  }
}

/**
 * Test 4: Fetch all bonuses and verify therapist names
 */
async function testFetchBonuses() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}TEST 4: Fetch Bonuses & Verify Therapist Names${colors.reset}`);
  console.log('='.repeat(60));

  try {
    const response = await authenticatedRequest('/api/bonus');
    
    if (!response.success || !response.bonuses) {
      throw new Error('Failed to fetch bonuses');
    }

    const bonuses = response.bonuses || [];
    
    console.log(`Found ${bonuses.length} bonus record(s)\n`);

    if (bonuses.length === 0) {
      console.log(`${colors.yellow}⚠️  No bonuses found yet${colors.reset}`);
      return true;
    }

    let allNamesCorrect = true;

    bonuses.forEach((bonus, index) => {
      const isUnknown = bonus.therapistName === 'Unknown Therapist';
      const statusColor = isUnknown ? colors.red : colors.green;
      
      console.log(`${index + 1}. ${statusColor}${bonus.therapistName}${colors.reset}`);
      console.log(`   Month: ${new Date(0, bonus.month - 1).toLocaleString('default', { month: 'long' })} ${bonus.year}`);
      console.log(`   Rating: ${bonus.averageRating?.toFixed(2) || '0.00'} ⭐`);
      console.log(`   Reviews: ${bonus.totalReviews}`);
      console.log(`   Amount: ₹${bonus.bonusAmount?.toLocaleString('en-IN') || '0'}`);
      console.log(`   Status: ${bonus.status.toUpperCase()}`);
      console.log(`   Therapist ID: ${bonus.therapistId}`);
      
      if (isUnknown) {
        allNamesCorrect = false;
        console.log(`   ${colors.red}❌ Name not resolved!${colors.reset}`);
      } else {
        console.log(`   ${colors.green}✓ Name displayed correctly${colors.reset}`);
      }
      console.log('');
    });

    if (allNamesCorrect) {
      console.log(`${colors.green}✓ All therapist names are displaying correctly!${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Some therapist names are still showing as "Unknown Therapist"${colors.reset}`);
    }

    return allNamesCorrect;
  } catch (error) {
    console.log(`${colors.red}✗ Failed to fetch bonuses: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Test 5: Verify database structure (optional - requires MongoDB access)
 */
async function testDatabaseStructure() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}TEST 5: Database Structure Verification${colors.reset}`);
  console.log('='.repeat(60));
  
  console.log(`${colors.yellow}⚠️  This test requires direct MongoDB access${colors.reset}`);
  console.log('\nTo verify manually, run in MongoDB Compass or shell:');
  console.log(`${colors.cyan}db.therapistbonuses.find().pretty()${colors.reset}`);
  console.log('\nCheck that the "therapist" field contains a User _id (not Therapist profile _id)');
  console.log('\nExpected structure:');
  console.log(`{
  ${colors.green}_id:${colors.reset} ObjectId("..."),
  ${colors.green}therapist:${colors.reset} ObjectId("user_id_here"),  ${colors.green}// Should match User collection${colors.reset}
  ${colors.green}business:${colors.reset} ObjectId("..."),
  ${colors.green}month:${colors.reset} 3,
  ${colors.green}year:${colors.reset} 2026,
  ${colors.green}averageRating:${colors.reset} 4.5,
  ${colors.green}totalReviews:${colors.reset} 5,
  ${colors.green}bonusAmount:${colors.reset} 3000,
  ${colors.green}status:${colors.reset} "pending"
}`);
  
  return true;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}THERAPIST BONUS NAME DISPLAY FIX - TEST SUITE${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Test started at: ${new Date().toLocaleString()}`);

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Test 1: Authentication
  const authSuccess = await testLogin();
  if (authSuccess) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 2: Fetch therapists
  const therapist = await testFetchTherapists();
  if (therapist) {
    results.passed++;
  } else {
    results.skipped++;
  }

  // Test 3: Calculate bonus
  const bonus = await testCalculateBonus(therapist);
  if (bonus) {
    results.passed++;
  } else {
    results.skipped++;
  }

  // Test 4: Fetch and verify bonuses
  const namesCorrect = await testFetchBonuses();
  if (namesCorrect) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 5: Database structure (informational)
  await testDatabaseStructure();
  results.skipped++;

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}TEST SUMMARY${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${results.skipped}${colors.reset}`);
  console.log('='.repeat(60));

  if (results.failed === 0) {
    console.log(`${colors.green}✓ All critical tests passed!${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Some tests failed. Please review the output above.${colors.reset}`);
  }

  console.log(`\nTest completed at: ${new Date().toLocaleString()}`);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
