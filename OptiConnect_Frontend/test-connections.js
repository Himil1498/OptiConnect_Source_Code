const http = require('http');
const https = require('https');

// Function to test HTTP endpoint
function testHttpEndpoint(options, expectedStatusCodes = [200]) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const isExpected = expectedStatusCodes.includes(res.statusCode);
        resolve({
          success: isExpected,
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });
    
    req.end();
  });
}

// Function to test WebSocket connection
function testWebSocket(url) {
  return new Promise((resolve) => {
    const WebSocket = require('ws');
    
    try {
      const ws = new WebSocket(url);
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve({
          success: false,
          error: 'Connection timeout'
        });
      }, 10000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve({
          success: true,
          message: 'WebSocket connection successful'
        });
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          error: error.message
        });
      });
      
    } catch (error) {
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}

async function runTests() {
  console.log('🧪 Testing OptiConnect Backend Connections...\n');
  
  // Test API Server (port 5000)
  console.log('📡 Testing API Server (localhost:5000)...');
  const apiTest = await testHttpEndpoint({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }, [200, 404]); // 404 is also acceptable if health endpoint doesn't exist
  
  if (apiTest.success) {
    console.log('✅ API Server is responding');
    console.log(`   Status: ${apiTest.status}`);
  } else {
    console.log('❌ API Server connection failed');
    console.log(`   Error: ${apiTest.error || 'Unknown error'}`);
  }
  
  // Test WebSocket Server (port 3002)
  console.log('\n🔌 Testing WebSocket Server (localhost:3002)...');
  const wsTest = await testWebSocket('ws://localhost:3002/ws');
  
  if (wsTest.success) {
    console.log('✅ WebSocket Server is responding');
    console.log(`   ${wsTest.message}`);
  } else {
    console.log('❌ WebSocket Server connection failed');
    console.log(`   Error: ${wsTest.error}`);
  }
  
  // Test Auth endpoint
  console.log('\n🔐 Testing Auth Endpoint...');
  const authTest = await testHttpEndpoint({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }, [400, 401, 422]); // These are expected for POST without body
  
  if (authTest.success) {
    console.log('✅ Auth Endpoint is responding');
    console.log(`   Status: ${authTest.status} (Expected for request without credentials)`);
  } else {
    console.log('❌ Auth Endpoint connection failed');
    console.log(`   Error: ${authTest.error || 'Unknown error'}`);
  }
  
  console.log('\n📊 Connection Test Summary:');
  console.log(`   API Server: ${apiTest.success ? '✅ UP' : '❌ DOWN'}`);
  console.log(`   WebSocket: ${wsTest.success ? '✅ UP' : '❌ DOWN'}`);
  console.log(`   Auth Endpoint: ${authTest.success ? '✅ UP' : '❌ DOWN'}`);
  
  console.log('\n💡 Next Steps:');
  if (!apiTest.success) {
    console.log('   - Start the backend API server: node server.js');
  }
  if (!wsTest.success) {
    console.log('   - Start the WebSocket server: node websocket-server.js');
  }
  console.log('   - Test the frontend with: npm start');
}

// Run the tests
runTests().catch(console.error);