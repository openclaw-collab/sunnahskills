import type {
  Guardian,
  Student,
  Registration,
  Payment,
  Waiver,
  InsertGuardian,
  InsertStudent,
  InsertRegistration,
  InsertPayment,
  InsertWaiver,
} from "@shared/schema";

/**
 * Factory functions for creating test data for registrations.
 * All factories allow partial overrides for specific test scenarios.
 */

// ============================================================================
// Guardian Factories
// ============================================================================

export function createGuardian(
  overrides: Partial<Guardian> = {}
): Guardian {
  return {
    id: 1,
    full_name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    emergency_contact_name: "Jane Smith",
    emergency_contact_phone: "+1 (555) 987-6543",
    relationship: "Parent",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createInsertGuardian(
  overrides: Partial<InsertGuardian> = {}
): InsertGuardian {
  const { id, created_at, ...guardian } = createGuardian(overrides);
  return guardian;
}

// ============================================================================
// Student Factories
// ============================================================================

export function createStudent(
  overrides: Partial<Student> = {}
): Student {
  return {
    id: 1,
    guardian_id: 1,
    full_name: "Tommy Smith",
    preferred_name: "Tom",
    date_of_birth: "2010-05-15",
    age: 14,
    gender: "male",
    prior_experience: "beginner",
    skill_level: "novice",
    medical_notes: "No known allergies",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createInsertStudent(
  overrides: Partial<InsertStudent> = {}
): InsertStudent {
  const { id, created_at, ...student } = createStudent(overrides);
  return student;
}

// ============================================================================
// Registration Factories
// ============================================================================

export function createRegistration(
  overrides: Partial<Registration> = {}
): Registration {
  return {
    id: 1,
    guardian_id: 1,
    student_id: 1,
    program_id: "bjj",
    session_id: 1,
    price_id: 1,
    status: "draft",
    preferred_start_date: null,
    schedule_choice: "monday-wednesday",
    sibling_registration_id: null,
    program_specific_data: JSON.stringify({
      gender: "boys",
      ageGroup: "11-14",
      trialClass: "yes",
      notes: "",
    }),
    admin_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createInsertRegistration(
  overrides: Partial<InsertRegistration> = {}
): InsertRegistration {
  const { id, created_at, updated_at, ...registration } = createRegistration({
    status: undefined,
    ...overrides,
  });
  return registration;
}

// ============================================================================
// Payment Factories
// ============================================================================

export function createPayment(
  overrides: Partial<Payment> = {}
): Payment {
  return {
    id: 1,
    registration_id: 1,
    stripe_payment_intent_id: "pi_test_1234567890",
    stripe_subscription_id: null,
    amount: 15000, // $150.00 in cents
    subtotal: 15000,
    discount_amount: 0,
    tax_amount: 0,
    currency: "usd",
    status: "paid",
    payment_type: "one_time",
    receipt_url: "https://pay.stripe.com/receipts/...",
    metadata: JSON.stringify({ program: "bjj", session: "spring-2024" }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createInsertPayment(
  overrides: Partial<InsertPayment> = {}
): InsertPayment {
  const { id, created_at, updated_at, ...payment } = createPayment({
    status: undefined,
    ...overrides,
  });
  return payment;
}

// ============================================================================
// Waiver Factories
// ============================================================================

export function createWaiver(
  overrides: Partial<Waiver> = {}
): Waiver {
  return {
    id: 1,
    registration_id: 1,
    liability_waiver: 1,
    photo_consent: 1,
    medical_consent: 1,
    terms_agreement: 1,
    signature_text: "John Smith",
    signed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createInsertWaiver(
  overrides: Partial<InsertWaiver> = {}
): InsertWaiver {
  const { id, created_at, ...waiver } = createWaiver(overrides);
  return waiver;
}

// ============================================================================
// Complete Registration Bundle
// ============================================================================

export interface RegistrationBundle {
  guardian: Guardian;
  student: Student;
  registration: Registration;
  payment: Payment;
  waiver: Waiver;
}

export function createCompleteRegistration(
  overrides: {
    guardian?: Partial<Guardian>;
    student?: Partial<Student>;
    registration?: Partial<Registration>;
    payment?: Partial<Payment>;
    waiver?: Partial<Waiver>;
  } = {}
): RegistrationBundle {
  const guardian = createGuardian(overrides.guardian);
  const student = createStudent({
    guardian_id: guardian.id,
    ...overrides.student,
  });
  const registration = createRegistration({
    guardian_id: guardian.id,
    student_id: student.id,
    ...overrides.registration,
  });
  const payment = createPayment({
    registration_id: registration.id,
    ...overrides.payment,
  });
  const waiver = createWaiver({
    registration_id: registration.id,
    ...overrides.waiver,
  });

  return { guardian, student, registration, payment, waiver };
}

// ============================================================================
// Status-specific Factories
// ============================================================================

export function createDraftRegistration(
  overrides: Partial<Registration> = {}
): Registration {
  return createRegistration({
    status: "draft",
    ...overrides,
  });
}

export function createSubmittedRegistration(
  overrides: Partial<Registration> = {}
): Registration {
  return createRegistration({
    status: "submitted",
    ...overrides,
  });
}

export function createPaidRegistration(
  overrides: Partial<Registration> = {}
): Registration {
  return createRegistration({
    status: "paid",
    ...overrides,
  });
}

export function createActiveRegistration(
  overrides: Partial<Registration> = {}
): Registration {
  return createRegistration({
    status: "active",
    ...overrides,
  });
}

export function createWaitlistedRegistration(
  overrides: Partial<Registration> = {}
): Registration {
  return createRegistration({
    status: "waitlisted",
    ...overrides,
  });
}

export function createCancelledRegistration(
  overrides: Partial<Registration> = {}
): Registration {
  return createRegistration({
    status: "cancelled",
    ...overrides,
  });
}

// ============================================================================
// Sibling Registration Factories
// ============================================================================

export function createSiblingRegistrations(
  guardianOverrides: Partial<Guardian> = {}
): {
  guardian: Guardian;
  students: Student[];
  registrations: Registration[];
} {
  const guardian = createGuardian(guardianOverrides);

  const student1 = createStudent({
    id: 1,
    guardian_id: guardian.id,
    full_name: "Tommy Smith",
    preferred_name: "Tom",
    age: 14,
  });

  const student2 = createStudent({
    id: 2,
    guardian_id: guardian.id,
    full_name: "Sarah Smith",
    preferred_name: "Sarah",
    age: 12,
  });

  const registration1 = createRegistration({
    id: 1,
    guardian_id: guardian.id,
    student_id: student1.id,
    sibling_registration_id: null,
  });

  const registration2 = createRegistration({
    id: 2,
    guardian_id: guardian.id,
    student_id: student2.id,
    sibling_registration_id: registration1.id,
  });

  return {
    guardian,
    students: [student1, student2],
    registrations: [registration1, registration2],
  };
}
