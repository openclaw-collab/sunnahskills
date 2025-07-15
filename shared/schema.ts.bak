import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  childName: text("child_name").notNull(),
  childAge: text("child_age").notNull(),
  parentName: text("parent_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  program: text("program").notNull(),
  experience: text("experience"),
  questions: text("questions"),
  waiverAccepted: text("waiver_accepted").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
  createdAt: true,
}).extend({
  childAge: z.string().min(1, "Please select your child's age"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email address"),
  program: z.string().min(1, "Please select a program"),
  waiverAccepted: z.literal("true", { errorMap: () => ({ message: "You must accept the waiver to proceed" }) }),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Please enter a message with at least 10 characters"),
});

export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Registration = typeof registrations.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
