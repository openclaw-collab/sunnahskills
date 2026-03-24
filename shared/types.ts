import {
  registrationStatusEnum,
  paymentStatusEnum,
  guardianSchema,
  studentSchema,
  registrationSchema,
  waiverSchema,
  paymentSchema,
  discountSchema,
  adminUserSchema,
  contactSchema,
} from "./schema";

export type RegistrationStatus = (typeof registrationStatusEnum)["_type"];
export type PaymentStatus = (typeof paymentStatusEnum)["_type"];

export type Guardian = typeof guardianSchema._type;
export type Student = typeof studentSchema._type;
export type Registration = typeof registrationSchema._type;
export type Waiver = typeof waiverSchema._type;
export type Payment = typeof paymentSchema._type;
export type Discount = typeof discountSchema._type;
export type AdminUser = typeof adminUserSchema._type;
export type Contact = typeof contactSchema._type;

