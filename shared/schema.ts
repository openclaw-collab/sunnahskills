import { z } from "zod";

export const insertRegistrationSchema = z.object({
  childName: z.string().min(1, "Child's name is required"),
  childAge: z.string().min(1, "Child's age is required"),
  parentName: z.string().min(1, "Parent/Guardian name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  program: z.string().min(1, "Program selection is required"),
  experience: z.string().optional(),
  questions: z.string().optional(),
  waiverAccepted: z.enum(["true", "false"]),
  createdAt: z.date().optional(),
});

export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;

export const insertContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  createdAt: z.date().optional(),
});

export type InsertContact = z.infer<typeof insertContactSchema>; 