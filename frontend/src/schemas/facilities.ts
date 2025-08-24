// src/schemas/facilities.ts
import { z } from "zod";

// Room Types - matching ACTUAL backend data
export const RoomTypes = [
  "CLASSROOM",
  "SPECIAL", 
  "OUTDOOR",
  "MULTI_PURPOSE",
  "OTHER",      // Backend has this
  "ART",        // Backend has this  
  "LIBRARY",    // Backend has this
  "LAB"         // Backend has this
] as const;

// Base Room Schema - matches backend RoomOut
export const RoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Room name is required"),
  room_code: z.string().min(1, "Room code is required"),
  room_type: z.enum(RoomTypes).default("CLASSROOM"),
  capacity: z.number().int().min(1, "Capacity must be at least 1").max(100, "Capacity cannot exceed 100").default(25),
  has_projector: z.boolean().default(false),
  has_computers: z.boolean().default(false),
  has_smartboard: z.boolean().default(false),
  has_sink: z.boolean().default(false),
  is_bookable: z.boolean().default(true),
  school_id: z.string().uuid(),
  is_active: z.boolean().default(true)
});
export type Room = z.infer<typeof RoomSchema>;

// Create Room Schema - matches backend RoomCreate
export const RoomCreateSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  room_code: z.string().min(1, "Room code is required"),
  room_type: z.enum(RoomTypes).default("CLASSROOM"),
  capacity: z.number().int().min(1, "Capacity must be at least 1").max(100, "Capacity cannot exceed 100").default(25),
  has_projector: z.boolean().default(false),
  has_computers: z.boolean().default(false),
  has_smartboard: z.boolean().default(false),
  has_sink: z.boolean().default(false),
  is_bookable: z.boolean().default(true),
  school_id: z.string().uuid()
});
export type RoomCreate = z.infer<typeof RoomCreateSchema>;

// Update Room Schema - matches backend RoomUpdate
export const RoomUpdateSchema = z.object({
  name: z.string().min(1, "Room name is required").optional(),
  room_code: z.string().min(1, "Room code is required").optional(),
  room_type: z.enum(RoomTypes).optional(),
  capacity: z.number().int().min(1, "Capacity must be at least 1").max(100, "Capacity cannot exceed 100").optional(),
  has_projector: z.boolean().optional(),
  has_computers: z.boolean().optional(),
  has_smartboard: z.boolean().optional(),
  has_sink: z.boolean().optional(),
  is_bookable: z.boolean().optional(),
  is_active: z.boolean().optional()
});
export type RoomUpdate = z.infer<typeof RoomUpdateSchema>;

// Room Usage Response Schema - for usage endpoint
export const RoomUsageSchema = z.object({
  room: z.object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
    type: z.string(),
    capacity: z.number()
  }),
  is_available: z.boolean(),
  assigned_classrooms: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    grade_level: z.string().nullable(),
    subject: z.string().nullable()
  })),
  usage_count: z.number()
});
export type RoomUsage = z.infer<typeof RoomUsageSchema>;