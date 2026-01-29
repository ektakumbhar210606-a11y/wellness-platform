const fetch = require('node-fetch');

async function testServiceCategories() {
  try {
    const response = await fetch('http://localhost:3000/api/service-categories');
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('Success:', data.success);
    console.log('Message:', data.message);
    console.log('\nCategories:');
    
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name} (${category.slug})`);
      });
      
      // Check if the required categories exist
      const requiredCategories = [
        'Massage Therapy',
        'Spa Services', 
        'Wellness Programs',
        'Corporate Wellness'
      ];
      
      console.log('\n--- Verification ---');
      requiredCategories.forEach(categoryName => {
        const exists = data.data.some(cat => cat.name === categoryName);
        console.log(`${categoryName}: ${exists ? '✅ Found' : '❌ Missing'}`);
      });
    } else {
      console.log('No categories data found');
    }
  } catch (error) {
    console.error('Error testing service categories:', error);
  }
}

testServiceCategories();