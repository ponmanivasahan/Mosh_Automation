const http = require('http');
const crypto = require('crypto');
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret_for_signature_verification_12345';
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_12345';
const { app, startServer } = require('./src/server');
const { pool } = require('./src/config/db');

const TEST_PORT = 5098;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Helper for making HTTP requests and capturing headers/cookies
const request = ({
  method = 'GET',
  path = '/',
  headers = {},
  body = null,
  cookies = []
}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { ...headers };

    if (cookies && cookies.length > 0) {
      reqHeaders['Cookie'] = cookies.join('; ');
    }

    let payloadString = null;
    if (body) {
      if (typeof body === 'object') {
        payloadString = JSON.stringify(body);
        if (!reqHeaders['Content-Type']) {
          reqHeaders['Content-Type'] = 'application/json';
        }
      } else {
        payloadString = body;
      }
      reqHeaders['Content-Length'] = Buffer.byteLength(payloadString);
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = null;
        }

        const rawCookies = res.headers['set-cookie'] || [];
        const parsedCookies = {};
        rawCookies.forEach((c) => {
          const parts = c.split(';')[0].split('=');
          parsedCookies[parts[0].trim()] = parts.slice(1).join('=');
        });

        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          json,
          setCookie: rawCookies,
          cookies: parsedCookies
        });
      });
    });

    req.on('error', reject);

    if (payloadString) {
      req.write(payloadString);
    }
    req.end();
  });
};

const runSecurityTests = async () => {
  console.log('\n======================================================');
  console.log('   MOSH AUTOMATION - COMPREHENSIVE SECURITY SUITE     ');
  console.log('======================================================\n');

  let server;
  let passedCount = 0;
  let failedCount = 0;

  const assert = (description, condition) => {
    if (condition) {
      console.log(`[PASS] ${description}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${description}`);
      failedCount++;
    }
  };

  try {
    server = await startServer(TEST_PORT);
    console.log(`Test server running on port ${TEST_PORT}\n`);

    // TEST 1: Unauthenticated protected endpoint rejection
    console.log('--- SECTION 1: Unauthenticated API Access Protection ---');
    const resUnauthAdmin = await request({ method: 'GET', path: '/api/admin/customers' });
    assert('Unauthenticated GET /api/admin/customers rejected with 401', resUnauthAdmin.status === 401);

    const resUnauthOrders = await request({ method: 'GET', path: '/api/orders' });
    assert('Unauthenticated GET /api/orders rejected with 401', resUnauthOrders.status === 401);

    const resUnauthMe = await request({ method: 'GET', path: '/api/auth/me' });
    assert('Unauthenticated GET /api/auth/me rejected with 401', resUnauthMe.status === 401);

    // TEST 2: Removed Migration Route
    console.log('\n--- SECTION 2: Unauthenticated Migration Endpoint Removal ---');
    const resMigrate = await request({ method: 'GET', path: '/api/payments/migrate-db' });
    assert('GET /api/payments/migrate-db returns 404 (endpoint removed)', resMigrate.status === 404);

    // TEST 3: Validation & Credential Protections
    console.log('\n--- SECTION 3: Input Validation & Credential Authentication ---');
    const resNoPhone = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: {}
    });
    assert('POST /api/auth/login without phone rejected with 400', resNoPhone.status === 400);

    const resInvalidPhone = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { phone: '123' }
    });
    assert('POST /api/auth/login with invalid phone rejected with 400', resInvalidPhone.status === 400);

    const resWrongPwd = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { phone: '9514714441', password: 'wrongpassword' }
    });
    assert('POST /api/auth/login with invalid password returns 401 generic error', resWrongPwd.status === 401);

    // TEST 4: Direct Portal Login (Inbuilt Verification - Name + Phone)
    console.log('\n--- SECTION 4: Direct Portal Login (Inbuilt Verification) ---');
    const customerPhone = '9876543210';
    const resDirectLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { name: 'Security Test Customer', phone: customerPhone }
    });
    assert('POST /api/auth/login with name + phone succeeds with 200 OK (inbuilt verified)', resDirectLogin.status === 200);
    assert('Tokens NOT exposed in JSON response body', !resDirectLogin.json?.token && !resDirectLogin.json?.refreshToken);

    const setCookies = resDirectLogin.setCookie.join('; ');
    assert('accessToken HttpOnly cookie issued', setCookies.includes('accessToken=') && setCookies.includes('HttpOnly'));
    assert('refreshToken HttpOnly cookie issued', setCookies.includes('refreshToken=') && setCookies.includes('HttpOnly'));
    assert('mosh_csrf_token non-HttpOnly cookie issued', setCookies.includes('mosh_csrf_token='));

    const customerCookies = [
      `accessToken=${resDirectLogin.cookies['accessToken']}`,
      `refreshToken=${resDirectLogin.cookies['refreshToken']}`,
      `mosh_csrf_token=${resDirectLogin.cookies['mosh_csrf_token']}`
    ];
    const customerCsrfToken = resDirectLogin.cookies['mosh_csrf_token'];

    // Verify session identity via /api/auth/me
    const resMe = await request({
      method: 'GET',
      path: '/api/auth/me',
      cookies: customerCookies
    });
    assert('GET /api/auth/me authenticated successfully with HttpOnly cookies', 
      resMe.status === 200 && resMe.json?.user?.phone === customerPhone && resMe.json?.user?.role === 'customer');

    // TEST 5: CORS allowlist enforcement
    console.log('\n--- SECTION 5: CORS Strict Origin Allowlist Verification ---');
    const resEvilCors = await request({
      method: 'GET',
      path: '/health',
      headers: { Origin: 'https://evil-attacker-site.com' }
    });
    assert('Disallowed CORS origin rejected with 403 Forbidden', resEvilCors.status === 403);

    const resValidCors = await request({
      method: 'GET',
      path: '/health',
      headers: { Origin: 'https://mosh-automation.vercel.app' }
    });
    assert('Authorized CORS origin accepted with 200 OK', 
      resValidCors.status === 200 && resValidCors.headers['access-control-allow-origin'] === 'https://mosh-automation.vercel.app');

    // TEST 6: Page Refresh & New Tab Persistence (Self-Healing Auto-Refresh)
    console.log('\n--- SECTION 6: Page Refresh & Session Persistence (Self-Healing) ---');
    // Simulate user refreshing page or opening new tab where accessToken is expired or omitted, but refreshToken is present
    const resRefreshSimulation = await request({
      method: 'GET',
      path: '/api/auth/me',
      cookies: [
        `refreshToken=${resDirectLogin.cookies['refreshToken']}`, // Only refresh token sent!
        `mosh_csrf_token=${customerCsrfToken}`
      ]
    });
    assert('Page refresh with refreshToken cookie seamlessly self-heals and returns 200 OK', 
      resRefreshSimulation.status === 200 && resRefreshSimulation.json?.user?.phone === customerPhone);
    assert('Self-healing middleware issues fresh accessToken on page refresh', 
      Boolean(resRefreshSimulation.cookies['accessToken']));

    // TEST 7: Role Separation (RBAC) - Customer blocked from admin endpoints
    console.log('\n--- SECTION 7: Role Separation & Admin Privilege Escalation Defense ---');
    const resCustomerAdminAccess = await request({
      method: 'GET',
      path: '/api/admin/customers',
      cookies: customerCookies
    });
    assert('Customer attempting to access /api/admin/customers rejected with 403 Forbidden', 
      resCustomerAdminAccess.status === 403);

    // TEST 8: CSRF Protection on Mutating Requests
    console.log('\n--- SECTION 8: CSRF Protection Verification ---');
    const resCsrfBlocked = await request({
      method: 'POST',
      path: '/api/cart/sync',
      headers: { Origin: 'https://evil-forged-request.com' },
      cookies: customerCookies,
      body: { items: [] }
    });
    assert('Mutating request from disallowed origin blocked by CSRF/CORS with 403', resCsrfBlocked.status === 403);

    // TEST 9: Server-Side Price Recalculation & Tamper Resistance
    console.log('\n--- SECTION 9: Server-Side Price Verification (Price Tampering Defense) ---');
    const [products] = await pool.query('SELECT id, price FROM products LIMIT 1');
    const testProduct = products[0];
    const testOrderId = `test-ord-${Date.now()}`;

    // Malicious customer total: ₹1
    const resOrderTamper = await request({
      method: 'POST',
      path: '/api/orders',
      headers: {
        Origin: 'https://mosh-automation.vercel.app',
        'X-CSRF-Token': customerCsrfToken
      },
      cookies: customerCookies,
      body: {
        id: testOrderId,
        total: 1.00,
        items: [{ productId: testProduct.id, quantity: 1, unitPrice: 1.00 }],
        shippingAddress: {
          address: '123 Test Street',
          city: 'Chennai',
          pincode: '600001'
        },
        paymentMethod: 'Online'
      }
    });

    assert('POST /api/orders created successfully', resOrderTamper.status === 201);
    
    const [savedOrders] = await pool.query('SELECT total FROM orders WHERE id = ?', [testOrderId]);
    const savedTotal = Number(savedOrders[0].total);
    const expectedAuthoritativePrice = Number(testProduct.price);
    assert(`Server enforced authoritative total ₹${expectedAuthoritativePrice} instead of tampered ₹1`, 
      savedTotal === expectedAuthoritativePrice);

    // TEST 10: Razorpay Payment Verification Security (HMAC timingSafeEqual & Tamper Defense)
    console.log('\n--- SECTION 10: Razorpay Payment Verification Security ---');
    const resFakePayment = await request({
      method: 'POST',
      path: '/api/payments/verify',
      headers: {
        Origin: 'https://mosh-automation.vercel.app',
        'X-CSRF-Token': customerCsrfToken
      },
      cookies: customerCookies,
      body: {
        razorpay_order_id: 'order_fake_12345',
        razorpay_payment_id: 'pay_fake_67890',
        razorpay_signature: 'fake_tampered_hex_signature_abcdef0123456789'
      }
    });
    assert('Tampered/forged Razorpay signature rejected with 400 Bad Request', 
      resFakePayment.status === 400 && resFakePayment.json?.message?.includes('Invalid payment signature'));

    // TEST 11: File Upload Restrictions in Estimations
    console.log('\n--- SECTION 11: File Upload MIME Type & Extension Restrictions ---');
    const resAdminLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { phone: '9514714441', password: 'adminpassword' }
    });
    assert('Admin login with password succeeds with 200 OK', resAdminLogin.status === 200);

    const adminCookies = [
      `accessToken=${resAdminLogin.cookies['accessToken']}`,
      `refreshToken=${resAdminLogin.cookies['refreshToken']}`,
      `mosh_csrf_token=${resAdminLogin.cookies['mosh_csrf_token']}`
    ];
    const adminCsrfToken = resAdminLogin.cookies['mosh_csrf_token'];

    // Attempt to upload dangerous file (.html) via multipart
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const multipartBody = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="attachmentUrl"; filename="malicious.html"\r\n` +
      `Content-Type: text/html\r\n\r\n` +
      `<html><script>alert(1)</script></html>\r\n` +
      `--${boundary}--\r\n`;

    const resBadUpload = await request({
      method: 'PATCH',
      path: '/api/estimations/non-existent-id',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Origin: 'https://mosh-automation.vercel.app',
        'X-CSRF-Token': adminCsrfToken
      },
      cookies: adminCookies,
      body: multipartBody
    });

    assert('Disallowed file upload (.html) rejected with 400 Invalid file type', 
      resBadUpload.status === 400 && resBadUpload.json?.message?.includes('Invalid file type'));

    // TEST 12: Refresh Token Rotation & Revocation
    console.log('\n--- SECTION 12: Refresh Token Rotation & Revocation ---');
    const resRefresh = await request({
      method: 'POST',
      path: '/api/auth/refresh',
      headers: {
        Origin: 'https://mosh-automation.vercel.app',
        'X-CSRF-Token': customerCsrfToken
      },
      cookies: [
        `refreshToken=${resDirectLogin.cookies['refreshToken']}`,
        `mosh_csrf_token=${resDirectLogin.cookies['mosh_csrf_token']}`
      ]
    });
    assert('POST /api/auth/refresh succeeds with 200 and rotates tokens', 
      resRefresh.status === 200 && Boolean(resRefresh.cookies['refreshToken']));

    // Replay attack: attempt to use the OLD (now rotated) refresh token
    const resTokenReuse = await request({
      method: 'POST',
      path: '/api/auth/refresh',
      headers: {
        Origin: 'https://mosh-automation.vercel.app',
        'X-CSRF-Token': customerCsrfToken
      },
      cookies: [
        `refreshToken=${resDirectLogin.cookies['refreshToken']}`, // Replayed old token!
        `mosh_csrf_token=${resDirectLogin.cookies['mosh_csrf_token']}`
      ]
    });
    assert('Reused refresh token detected and rejected with 401 Unauthorized', 
      resTokenReuse.status === 401 && resTokenReuse.json?.message?.includes('revoked'));

    // TEST 13: Core Functional Endpoints Post-Cleanup
    console.log('\n--- SECTION 13: Post-Cleanup Core Features Integrity ---');
    const resProducts = await request({ method: 'GET', path: '/api/products' });
    assert('GET /api/products returns 200 and catalog array', 
      resProducts.status === 200 && Array.isArray(resProducts.json?.products) && resProducts.json.products.length > 0);

    const resStories = await request({ method: 'GET', path: '/api/stories' });
    assert('GET /api/stories returns 200 and stories array', 
      resStories.status === 200 && Array.isArray(resStories.json?.stories));

    const resBilling = await request({ method: 'GET', path: '/api/billing' });
    assert('GET /api/billing returns 200 and settings object', 
      resBilling.status === 200 && Boolean(resBilling.json?.settings));

    // TEST 14: Logout Token Revocation
    console.log('\n--- SECTION 14: Logout Token Revocation & Cookie Clearing ---');
    const resLogout = await request({
      method: 'POST',
      path: '/api/auth/logout',
      headers: {
        Origin: 'https://mosh-automation.vercel.app',
        'X-CSRF-Token': resRefresh.cookies['mosh_csrf_token'] || customerCsrfToken
      },
      cookies: [
        `refreshToken=${resRefresh.cookies['refreshToken']}`,
        `accessToken=${resRefresh.cookies['accessToken']}`
      ]
    });
    assert('POST /api/auth/logout succeeds with 200', resLogout.status === 200);
    const logoutCookies = resLogout.setCookie.join('; ');
    assert('accessToken and refreshToken cleared on logout', 
      logoutCookies.includes('accessToken=;') && logoutCookies.includes('refreshToken=;'));

    // Cleanup test order
    await pool.query('DELETE FROM orders WHERE id = ?', [testOrderId]);

    console.log('\n--- SECTION 15: Upload Serving & Dynamic Fallback Defense ---');
    const resStaticPdf = await request({
      method: 'GET',
      path: '/uploads/1788455930705-27600817.pdf'
    });
    assert('GET /uploads/:filename returns 200 with application/pdf',
      resStaticPdf.status === 200 && resStaticPdf.headers['content-type'].includes('application/pdf'));

    const resFallbackPdf = await request({
      method: 'GET',
      path: '/uploads/missing-ephemeral-upload-12345.pdf'
    });
    assert('Missing ephemeral upload recovers with 200 and dynamic PDF fallback',
      resFallbackPdf.status === 200 && resFallbackPdf.headers['content-type'].includes('application/pdf'));

    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('======================================================\n');

  } catch (error) {
    console.error('Fatal test execution error:', error);
    failedCount++;
  } finally {
    if (server) {
      server.close();
    }
    process.exit(failedCount > 0 ? 1 : 0);
  }
};

runSecurityTests();
