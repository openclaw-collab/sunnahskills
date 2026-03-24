/**
 * Test fixtures and factory functions.
 * 
 * This module provides factory functions for creating consistent test data.
 * All factories support partial overrides for specific test scenarios.
 * 
 * @example
 * ```typescript
 * import { createGuardian, createStudent, createCompleteRegistration } from '@/__tests__/fixtures';
 * 
 * // Create a guardian with default values
 * const guardian = createGuardian();
 * 
 * // Create a guardian with specific overrides
 * const guardian = createGuardian({
 *   full_name: "Jane Doe",
 *   email: "jane@example.com"
 * });
 * 
 * // Create a complete registration bundle
 * const { guardian, student, registration, payment, waiver } = createCompleteRegistration();
 * ```
 */

// Registration fixtures
export {
  createGuardian,
  createInsertGuardian,
  createStudent,
  createInsertStudent,
  createRegistration,
  createInsertRegistration,
  createPayment,
  createInsertPayment,
  createWaiver,
  createInsertWaiver,
  createCompleteRegistration,
  createDraftRegistration,
  createSubmittedRegistration,
  createPaidRegistration,
  createActiveRegistration,
  createWaitlistedRegistration,
  createCancelledRegistration,
  createSiblingRegistrations,
  type RegistrationBundle,
} from "./registrations";

// Program fixtures
export {
  createProgramConfig,
  createBJJProgram,
  createArcheryProgram,
  createOutdoorProgram,
  createBullyproofingProgram,
  createSession,
  createSessions,
  createFullSession,
  createWaitlistSession,
  createProgramPrice,
  createMonthlyPrice,
  createPerSessionPrice,
  createSiblingDiscountPrice,
  createProgramPrices,
  createCompleteProgram,
  getScheduleOptions,
  SCHEDULE_OPTIONS,
  type ProgramSession,
  type ProgramPrice,
  type ProgramConfig,
  type ProgramBundle,
} from "./programs";
