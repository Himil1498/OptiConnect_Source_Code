/**
 * Quick Backend Test Script
 * Tests backend connectivity and creates test user
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runQuickTest() {
  console.log('\n' + '='.repeat(60));
  log('🧪 QUICK BACKEND CONNECTIVITY TEST', 'cyan');
  console.log('='.repeat(60) + '\n');

  // Test 1: Backend Health Check
  console.log('1️⃣  Testing Backend Health...');
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    log('   ✅ Backend is running!', 'green');
    log(`   📊 Status: ${response.data.status}`, 'blue');
    log(`   💾 Database: ${response.data.database}`, 'blue');
  } catch (error) {
    log('   ❌ Backend health check failed!', 'red');
    log(`   Error: ${error.message}`, 'red');
    log('   Make sure backend server is running: npm run dev', 'yellow');
    process.exit(1);
  }

  console.log('');

  // Test 2: Register Test User
  console.log('2️⃣  Creating Test User...');
  try {
    const registerData = {
      username: 'admin',
      email: 'admin@opticonnect.com',
      password: 'Admin@123',
      full_name: 'Admin User',
      role: 'admin'
    };

    const response = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
    log('   ✅ Test user created successfully!', 'green');
    log(`   👤 Username: ${response.data.user.username}`, 'blue');
    log(`   📧 Email: ${response.data.user.email}`, 'blue');
    log(`   🔑 Role: ${response.data.user.role}`, 'blue');
    log(`   🎟️  Token: ${response.data.token.substring(0, 30)}...`, 'blue');
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      log('   ⚠️  User already exists (this is OK)', 'yellow');
      log('   You can use existing credentials to login', 'yellow');
    } else {
      log('   ❌ Failed to create user', 'red');
      log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
      process.exit(1);
    }
  }

  console.log('');

  // Test 3: Login Test
  console.log('3️⃣  Testing Login...');
  try {
    const loginData = {
      email: 'admin@opticonnect.com',
      password: 'Admin@123'
    };

    const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    log('   ✅ Login successful!', 'green');
    log(`   👤 Welcome: ${response.data.user.full_name}`, 'blue');
    log(`   🔑 Role: ${response.data.user.role}`, 'blue');
    log(`   🎟️  Token received: Yes`, 'blue');
  } catch (error) {
    log('   ❌ Login failed', 'red');
    log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
    process.exit(1);
  }

  console.log('');
  console.log('='.repeat(60));
  log('🎉 ALL TESTS PASSED!', 'green');
  console.log('='.repeat(60));
  console.log('');
  log('📝 Test Credentials:', 'cyan');
  log('   Email: admin@opticonnect.com', 'blue');
  log('   Password: Admin@123', 'blue');
  console.log('');
  log('🚀 Next Step: Start frontend and login!', 'green');
  log('   cd OptiConnect_Frontend', 'yellow');
  log('   npm start', 'yellow');
  console.log('');
}

// Run the test
runQuickTest().catch(error => {
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});
