// src/schemas/facilities.ts
import { z } from "zod";

export const RoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  building: z.string().optional(),
  capacity: z.number().int().optional(),
  in_use: z.boolean().optional(),
});
export type Room = z.infer<typeof RoomSchema>;
