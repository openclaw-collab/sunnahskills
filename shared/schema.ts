import { z } from "zod";

// Status enums
export const registrationStatusEnum = z.enum([
  "draft",
  "submitted",
  "pending_payment",
  "paid",
  "active",
  "waitlisted",
  "cancelled",
  "refunded",
]);

export const paymentStatusEnum = z.enum([
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
]);

// Core entities matching db/schema.sql

export const guardianSchema = z.object({
  id: z.number().int().positive().optional(),
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  relationship: z.string().optional().nullable(),
  created_at: z.string().datetime().optional(),
});

export const studentSchema = z.object({
  id: z.number().int().positive().optional(),
  guardian_id: z.number().int().positive(),
  full_name: z.string().min(1),
  preferred_name: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  age: z.number().int().optional().nullable(),
  gender: z.string().optional().nullable(),
  prior_experience: z.string().optional().nullable(),
  skill_level: z.string().optional().nullable(),
  medical_notes: z.string().optional().nullable(),
  created_at: z.string().datetime().optional(),
});

export const registrationSchema = z.object({
  id: z.number().int().positive().optional(),
  guardian_id: z.number().int().positive(),
  student_id: z.number().int().positive(),
  program_id: z.string().min(1),
  session_id: z.number().int().positive().optional().nullable(),
  price_id: z.number().int().positive().optional().nullable(),
  status: registrationStatusEnum.default("draft"),
  preferred_start_date: z.string().optional().nullable(),
  schedule_choice: z.string().optional().nullable(),
  sibling_registration_id: z.number().int().optional().nullable(),
  program_specific_data: z.string().optional().nullable(),
  admin_notes: z.string().optional().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const waiverSchema = z.object({
  id: z.number().int().positive().optional(),
  registration_id: z.number().int().positive(),
  liability_waiver: z.number().int().min(0).max(1),
  photo_consent: z.number().int().min(0).max(1),
  medical_consent: z.number().int().min(0).max(1),
  terms_agreement: z.number().int().min(0).max(1),
  signature_text: z.string().optional().nullable(),
  signed_at: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime().optional(),
});

export const paymentSchema = z.object({
  id: z.number().int().positive().optional(),
  registration_id: z.number().int().positive(),
  stripe_payment_intent_id: z.string().optional().nullable(),
  stripe_subscription_id: z.string().optional().nullable(),
  amount: z.number().int().nonnegative(),
  subtotal: z.number().int().optional().nullable(),
  discount_amount: z.number().int().optional().nullable(),
  tax_amount: z.number().int().optional().nullable(),
  currency: z.string().default("usd"),
  status: paymentStatusEnum.default("unpaid"),
  payment_type: z.string().optional().nullable(),
  receipt_url: z.string().url().optional().nullable(),
  metadata: z.string().optional().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const discountSchema = z.object({
  id: z.number().int().positive().optional(),
  code: z.string().min(1),
  type: z.enum(["percentage", "fixed", "sibling"]),
  value: z.number().int().nonnegative(),
  program_id: z.string().optional().nullable(),
  max_uses: z.number().int().optional().nullable(),
  current_uses: z.number().int().optional().nullable(),
  valid_from: z.string().datetime().optional().nullable(),
  valid_until: z.string().datetime().optional().nullable(),
  active: z.number().int().min(0).max(1).default(1),
  created_at: z.string().datetime().optional(),
});

export const adminUserSchema = z.object({
  id: z.number().int().positive().optional(),
  email: z.string().email(),
  password_hash: z.string().min(1),
  name: z.string().optional().nullable(),
  role: z.string().default("admin"),
  last_login: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime().optional(),
});

// Simple contact insert/schema reused by API
export const contactSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
  timestamp: z.string().datetime().optional(),
});

// Admin login payload
export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Export types
export type Guardian = z.infer<typeof guardianSchema>;
export type Student = z.infer<typeof studentSchema>;
export type Registration = z.infer<typeof registrationSchema>;
export type Waiver = z.infer<typeof waiverSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type Discount = z.infer<typeof discountSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type Contact = z.infer<typeof contactSchema>;

export type InsertGuardian = Omit<Guardian, "id" | "created_at">;
export type InsertStudent = Omit<Student, "id" | "created_at">;
export type InsertRegistration = Omit<
  Registration,
  "id" | "created_at" | "updated_at" | "status"
> & {
  status?: z.infer<typeof registrationStatusEnum>;
};
export type InsertWaiver = Omit<Waiver, "id" | "created_at">;
export type InsertPayment = Omit<Payment, "id" | "created_at" | "updated_at" | "status"> & {
  status?: z.infer<typeof paymentStatusEnum>;
};
export type InsertDiscount = Omit<Discount, "id" | "created_at" | "current_uses">;
export type InsertAdminUser = Omit<AdminUser, "id" | "created_at" | "last_login">;
export type InsertContact = Omit<Contact, "id" | "timestamp">;