/**
 * Verification Script for 401 Fix
 * Run this to verify all changes are correctly applied
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 VERIFYING 401 FIX IMPLEMENTATION\n');
console.log('='.repeat(60));

const checks = [];

// Check 1: Backend .env has correct JWT_EXPIRE
try {
  const envPath = path.join(__dirname, 'OptiConnect_Backend', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const jwtExpire = envContent.match(/JWT_EXPIRE=(.+)/)?.[1];

  if (jwtExpire === '2h') {
    checks.push({ name: 'Backend JWT_EXPIRE', status: '✅', value: '2h' });
  } else {
    checks.push({ name: 'Backend JWT_EXPIRE', status: '❌', value: jwtExpire || 'NOT SET' });
  }
} catch (error) {
  checks.push({ name: 'Backend JWT_EXPIRE', status: '❌', value: 'File not found' });
}

// Check 2: Frontend apiService.ts has correct expiresIn
try {
  const apiServicePath = path.join(__dirname, 'OptiConnect_Frontend', 'src', 'services', 'apiService.ts');
  const apiServiceContent = fs.readFileSync(apiServicePath, 'utf8');

  // Check for expiresIn: 7200
  if (apiServiceContent.includes('expiresIn: 7200')) {
    checks.push({ name: 'Frontend token expiry', status: '✅', value: '7200 seconds (2h)' });
  } else if (apiServiceContent.includes('expiresIn: 86400')) {
    checks.push({ name: 'Frontend token expiry', status: '❌', value: '86400 seconds (24h) - NEEDS UPDATE' });
  } else {
    checks.push({ name: 'Frontend token expiry', status: '⚠️', value: 'Could not verify' });
  }

  // Check 3: No mock token returns in refreshToken
  if (apiServiceContent.includes('refreshed_mock_token')) {
    checks.push({ name: 'Mock token removal', status: '❌', value: 'STILL HAS MOCK TOKENS' });
  } else {
    checks.push({ name: 'Mock token removal', status: '✅', value: 'No mock tokens found' });
  }

  // Check 4: refreshToken always uses backend
  const refreshTokenMatch = apiServiceContent.match(/async refreshToken\(token: string\): Promise<string> \{[\s\S]*?\n  \}/);
  if (refreshTokenMatch) {
    const refreshTokenFunc = refreshTokenMatch[0];
    if (refreshTokenFunc.includes('apiClient.post') && !refreshTokenFunc.includes('process.env.NODE_ENV')) {
      checks.push({ name: 'refreshToken uses backend', status: '✅', value: 'Always calls backend API' });
    } else if (refreshTokenFunc.includes('process.env.NODE_ENV')) {
      checks.push({ name: 'refreshToken uses backend', status: '❌', value: 'STILL HAS DEV BYPASS' });
    } else {
      checks.push({ name: 'refreshToken uses backend', status: '⚠️', value: 'Could not verify' });
    }
  }

  // Check 5: verifyToken always uses backend
  const verifyTokenMatch = apiServiceContent.match(/async verifyToken\(token: string\): Promise<boolean> \{[\s\S]*?\n  \}/);
  if (verifyTokenMatch) {
    const verifyTokenFunc = verifyTokenMatch[0];
    if (verifyTokenFunc.includes('apiClient.get') && !verifyTokenFunc.includes('process.env.NODE_ENV')) {
      checks.push({ name: 'verifyToken uses backend', status: '✅', value: 'Always calls backend API' });
    } else if (verifyTokenFunc.includes('process.env.NODE_ENV')) {
      checks.push({ name: 'verifyToken uses backend', status: '❌', value: 'STILL HAS DEV BYPASS' });
    } else {
      checks.push({ name: 'verifyToken uses backend', status: '⚠️', value: 'Could not verify' });
    }
  }
} catch (error) {
  checks.push({ name: 'Frontend apiService.ts', status: '❌', value: 'File not found' });
}

// Check 6: Backend auth middleware has logging
try {
  const authPath = path.join(__dirname, 'OptiConnect_Backend', 'src', 'middleware', 'auth.js');
  const authContent = fs.readFileSync(authPath, 'utf8');

  if (authContent.includes('🔑 Token received:') && authContent.includes('✅ Token decoded:')) {
    checks.push({ name: 'Auth middleware logging', status: '✅', value: 'Enhanced logging present' });
  } else {
    checks.push({ name: 'Auth middleware logging', status: '⚠️', value: 'Basic logging' });
  }
} catch (error) {
  checks.push({ name: 'Auth middleware logging', status: '❌', value: 'File not found' });
}

// Check 7: Backend controller has case-insensitive role check
try {
  const controllerPath = path.join(__dirname, 'OptiConnect_Backend', 'src', 'controllers', 'temporaryAccessController.js');
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');

  if (controllerContent.includes('.toLowerCase()')) {
    checks.push({ name: 'Case-insensitive roles', status: '✅', value: 'Implemented' });
  } else {
    checks.push({ name: 'Case-insensitive roles', status: '❌', value: 'NOT IMPLEMENTED' });
  }
} catch (error) {
  checks.push({ name: 'Case-insensitive roles', status: '❌', value: 'File not found' });
}

// Print results
console.log('\n📋 Verification Results:\n');
checks.forEach(check => {
  console.log(`${check.status} ${check.name}`);
  console.log(`   └─ ${check.value}\n`);
});

// Summary
const passed = checks.filter(c => c.status === '✅').length;
const failed = checks.filter(c => c.status === '❌').length;
const warnings = checks.filter(c => c.status === '⚠️').length;

console.log('='.repeat(60));
console.log(`\n📊 Summary: ${passed} passed, ${failed} failed, ${warnings} warnings\n`);

if (failed === 0 && warnings === 0) {
  console.log('✅ ALL CHECKS PASSED! Your fix is ready to test.');
  console.log('\n📝 Next Steps:');
  console.log('   1. Clear localStorage in browser');
  console.log('   2. Restart frontend server');
  console.log('   3. Re-login to get fresh JWT token');
  console.log('   4. Test application - no more 401 errors!\n');
} else if (failed > 0) {
  console.log('❌ SOME CHECKS FAILED! Please review the issues above.');
  console.log('   Run this script again after making corrections.\n');
} else {
  console.log('⚠️  SOME CHECKS COULD NOT BE VERIFIED.');
  console.log('   Review warnings above and test manually.\n');
}

console.log('='.repeat(60));
console.log('\n');
