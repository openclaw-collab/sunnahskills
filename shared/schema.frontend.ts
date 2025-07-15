import { z } from "zod";

export const insertRegistrationSchema = z.object({
  childName: z.string().min(1, "Please enter your child's name"),
  childAge: z.string().min(1, "Please select your child's age"),
  parentName: z.string().min(1, "Please enter the parent/guardian's name"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email address"),
  program: z.string().min(1, "Please select a program"),
  experience: z.string().optional(),
  questions: z.string().optional(),
  waiverAccepted: z.literal("true", { errorMap: () => ({ message: "You must accept the waiver to proceed" }) }),
});

export const insertContactSchema = z.object({
  name: z.string().min(1, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Please enter a message with at least 10 characters"),
});

export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>; 