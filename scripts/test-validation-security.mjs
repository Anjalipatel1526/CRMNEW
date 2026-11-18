import {
  LoginSchema,
  DocumentUploadMetadataSchema,
  EmployeeCreateSchema,
  CreateCustomerSchema,
  CreateLeadSchema,
} from '../packages/validators/src/index.ts';

async function runValidationSecurityTests() {
  console.log('='.repeat(80));
  console.log('TESTING PHASE F: RUNTIME REQUEST VALIDATION & ZOD SCHEMAS (VULN-10)');
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

  // 1. LoginSchema with valid payload
  const loginValid = LoginSchema.safeParse({ email: 'sales@apexmotors.com', password: 'ValidPassword123!' });
  assert('LoginSchema accepts valid credentials', loginValid.success);

  // 2. LoginSchema rejects invalid email
  const loginInvalidEmail = LoginSchema.safeParse({ email: 'not-an-email', password: 'ValidPassword123!' });
  assert('LoginSchema rejects malformed email address', !loginInvalidEmail.success && loginInvalidEmail.error.issues[0].path[0] === 'email');

  // 3. LoginSchema rejects missing password
  const loginMissingPass = LoginSchema.safeParse({ email: 'sales@apexmotors.com', password: '' });
  assert('LoginSchema rejects empty password', !loginMissingPass.success);

  // 4. DocumentUploadMetadataSchema accepts valid document upload
  const docValid = DocumentUploadMetadataSchema.safeParse({
    fileName: 'aadhaar_card.pdf',
    fileType: 'application/pdf',
    documentType: 'kyc_aadhaar',
    entityType: 'customer',
    entityId: 'cust-123',
    fileSize: 1024 * 1024,
  });
  assert('DocumentUploadMetadataSchema accepts valid document payload', docValid.success);

  // 5. DocumentUploadMetadataSchema rejects file exceeding 15MB limit
  const docOversized = DocumentUploadMetadataSchema.safeParse({
    fileName: 'large_archive.pdf',
    fileType: 'application/pdf',
    documentType: 'kyc_pan',
    fileSize: 20 * 1024 * 1024, // 20MB
  });
  assert('DocumentUploadMetadataSchema enforces 15MB file size limit', !docOversized.success);

  // 6. DocumentUploadMetadataSchema rejects missing fileName
  const docMissingName = DocumentUploadMetadataSchema.safeParse({
    fileName: '',
    fileType: 'application/pdf',
    documentType: 'kyc_pan',
  });
  assert('DocumentUploadMetadataSchema rejects empty fileName', !docMissingName.success);

  // 7. EmployeeCreateSchema accepts valid employee
  const empValid = EmployeeCreateSchema.safeParse({
    fullName: 'Rahul Sharma',
    email: 'rahul@dealership.com',
    role: 'sales_executive',
  });
  assert('EmployeeCreateSchema accepts valid employee input', empValid.success);

  // 8. EmployeeCreateSchema rejects invalid email
  const empInvalidEmail = EmployeeCreateSchema.safeParse({
    fullName: 'Rahul Sharma',
    email: 'rahul_at_dealership',
    role: 'sales_executive',
  });
  assert('EmployeeCreateSchema rejects invalid email format', !empInvalidEmail.success);

  // 9. EmployeeCreateSchema rejects short full name
  const empShortName = EmployeeCreateSchema.safeParse({
    fullName: 'R',
    email: 'rahul@dealership.com',
  });
  assert('EmployeeCreateSchema rejects single-letter name', !empShortName.success);

  // 10. CreateCustomerSchema enforces required phone and first name
  const custMissingPhone = CreateCustomerSchema.safeParse({
    firstName: 'Priya',
    phone: '',
  });
  assert('CreateCustomerSchema rejects empty phone', !custMissingPhone.success);

  console.log('='.repeat(80));
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('='.repeat(80));

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runValidationSecurityTests();
