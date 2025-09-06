import { z } from 'zod';
export const AcademicYearSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    start_date: z.string(), // ISO date
    end_date: z.string(), // ISO date
    is_active: z.boolean().default(false),
});
export const AcademicYearCreateSchema = AcademicYearSchema.omit({ id: true });
export const AcademicYearUpdateSchema = AcademicYearCreateSchema.partial();
