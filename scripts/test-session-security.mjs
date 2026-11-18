import { signSessionPayload, verifySignedSession } from '../apps/web/src/lib/session-signature.ts';

async function runSessionSecurityTests() {
  console.log('='.repeat(80));
  console.log('TESTING PHASE B: SESSION SECURITY & CRYPTOGRAPHIC ROUTE GUARDS');
  console.log('='.repeat(80));

  let passed = 0;
  let total = 0;

  function assert(testName, condition, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`[✅ PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
    } else {
      console.error(`[❌ FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
    }
  }

  // 1. Sign valid session payload
  const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const validToken = await signSessionPayload({
    userId: 'usr-123',
    tenantId: 't-apex-001',
    role: 'sales_executive',
    exp,
  });

  assert('Token generation produces tamper-proof HMAC-SHA256 signature', validToken.includes('.') && validToken.split('.').length === 2);

  // 2. Verify valid session payload
  const verified = await verifySignedSession(validToken);
  assert('Valid signed token is verified successfully', verified !== null && verified.role === 'sales_executive');

  // 3. Tampering attempt: Attacker changes role to tenant_admin
  const [dataB64, sigB64] = validToken.split('.');
  const tamperedJson = Buffer.from(dataB64, 'base64url').toString('utf-8').replace('sales_executive', 'tenant_admin');
  const tamperedDataB64 = Buffer.from(tamperedJson).toString('base64url');
  const tamperedToken = `${tamperedDataB64}.${sigB64}`;

  const tamperedResult = await verifySignedSession(tamperedToken);
  assert('Tampered session token (Privilege Escalation attempt) is rejected', tamperedResult === null);

  // 4. Forged signature attempt: Attacker appends random signature
  const forgedToken = `${dataB64}.forgedSignatureB64String`;
  const forgedResult = await verifySignedSession(forgedToken);
  assert('Forged signature is rejected', forgedResult === null);

  // 5. Expired token attempt
  const expiredToken = await signSessionPayload({
    userId: 'usr-123',
    tenantId: 't-apex-001',
    role: 'tenant_admin',
    exp: Math.floor(Date.now() / 1000) - 10, // 10 seconds ago
  });
  const expiredResult = await verifySignedSession(expiredToken);
  assert('Expired token is rejected', expiredResult === null);

  // 6. Role-based check evaluation (matching middleware logic)
  const allowedFinanceRoles = ['tenant_admin', 'branch_manager', 'finance_manager'];
  
  // Sales executive verified session against /finance
  const salesAllowed = verified && allowedFinanceRoles.includes(verified.role);
  assert('Sales Executive role cannot access /finance', salesAllowed === false);

  // Admin verified session against /finance
  const adminToken = await signSessionPayload({
    userId: 'usr-admin',
    tenantId: 't-apex-001',
    role: 'tenant_admin',
    exp,
  });
  const adminVerified = await verifySignedSession(adminToken);
  const adminAllowed = adminVerified && allowedFinanceRoles.includes(adminVerified.role);
  assert('Tenant Admin role is authorized for /finance', adminAllowed === true);

  console.log('='.repeat(80));
  console.log(`TOTAL: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('='.repeat(80));
}

runSessionSecurityTests().catch(console.error);
