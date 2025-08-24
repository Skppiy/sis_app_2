// src/schemas/academics.ts
import { z } from "zod";

// NOTE: match exact backend fields once confirmed
export const AcademicYearSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  start_date: z.string().min(1, "Start date is required"), // ISO yyyy-mm-dd
  end_date: z.string().min(1, "End date is required"),
  is_active: z.boolean().default(false),
});
export type AcademicYear = z.infer<typeof AcademicYearSchema>;

export const AcademicYearCreateSchema = AcademicYearSchema.partial({
  id: true,
}).required({
  name: true,
  start_date: true,
  end_date: true,
});
export type AcademicYearCreate = z.infer<typeof AcademicYearCreateSchema>;

export const AcademicYearUpdateSchema = AcademicYearCreateSchema.partial();
export type AcademicYearUpdate = z.infer<typeof AcademicYearUpdateSchema>;

export const SubjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1).optional(),
});
export type Subject = z.infer<typeof SubjectSchema>;

export const ClassroomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  grade_level: z.string().optional(),
  capacity: z.number().int().optional(),
});
export type Classroom = z.infer<typeof ClassroomSchema>;
