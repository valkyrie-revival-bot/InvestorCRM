#!/usr/bin/env node

/**
 * Test script for BDR chat API
 * Tests the /api/chat endpoint with authentication
 */

const https = require('https');

// Configuration
const BASE_URL = 'valhros.com';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword';

let sessionCookie = null;

/**
 * Make HTTPS request
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';

      // Capture cookies from Set-Cookie header
      if (res.headers['set-cookie']) {
        res.headers['set-cookie'].forEach(cookie => {
          if (cookie.includes('sb-')) {
            sessionCookie = cookie.split(';')[0];
          }
        });
      }

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

/**
 * Step 1: Login and get session
 */
async function login() {
  console.log('\n📝 Step 1: Logging in...');

  const loginData = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  const options = {
    hostname: BASE_URL,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  try {
    const response = await makeRequest(options, loginData);

    if (response.statusCode === 200) {
      console.log('✅ Login successful');
      console.log('   Session cookie:', sessionCookie ? 'captured' : 'not found');
      return true;
    } else {
      console.log('❌ Login failed');
      console.log('   Status:', response.statusCode);
      console.log('   Body:', response.body);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

/**
 * Step 2: Test chat API
 */
async function testChat() {
  console.log('\n💬 Step 2: Testing BDR chat...');

  if (!sessionCookie) {
    console.log('❌ No session cookie available');
    return false;
  }

  const chatData = JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'Hello, this is a test message.'
      }
    ]
  });

  const options = {
    hostname: BASE_URL,
    path: '/api/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(chatData),
      'Cookie': sessionCookie
    }
  };

  try {
    const response = await makeRequest(options, chatData);

    console.log('   Status:', response.statusCode);
    console.log('   Content-Type:', response.headers['content-type']);

    if (response.statusCode === 200) {
      console.log('✅ Chat API responding');
      console.log('   Response preview:', response.body.substring(0, 100) + '...');
      return true;
    } else {
      console.log('❌ Chat API error');
      console.log('   Body:', response.body);
      return false;
    }
  } catch (error) {
    console.error('❌ Chat error:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Testing BDR Chat at', BASE_URL);
  console.log('='..repeat(50));

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Tests failed: Could not authenticate');
    process.exit(1);
  }

  // Step 2: Test chat
  const chatSuccess = await testChat();

  // Summary
  console.log('\n' + '='.repeat(50));
  if (chatSuccess) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Tests failed');
    process.exit(1);
  }
}

// Check if credentials are provided
if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) {
  console.error('⚠️  Warning: Using default test credentials');
  console.error('   Set TEST_EMAIL and TEST_PASSWORD environment variables for actual testing');
  console.log();
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
