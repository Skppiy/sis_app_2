// src/features/facilities/services/rooms.ts
import { apiFetch } from "@/api/requestHelper";
import { Room, RoomSchema, RoomCreate, RoomCreateSchema, RoomUpdate, RoomUsage, RoomUsageSchema } from "@/schemas/facilities";
import { z } from "zod";

const RoomsListSchema = z.array(RoomSchema);

// List rooms with optional filtering
export async function listRooms(params?: {
  school_id?: string;
  room_type?: string;
  bookable_only?: boolean;
  available_only?: boolean;
  min_capacity?: number;
  has_projector?: boolean;
  has_computers?: boolean;
  has_smartboard?: boolean;
  has_sink?: boolean;
}): Promise<Room[]> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  const queryString = searchParams.toString();
  const url = queryString ? `/rooms?${queryString}` : "/rooms";
  
  const data = await apiFetch<unknown>(url);
  return RoomsListSchema.parse(data);
}

// Create new room
export async function createRoom(payload: RoomCreate): Promise<Room> {
  // Validate payload against schema
  const validatedPayload = RoomCreateSchema.parse(payload);
  
  const data = await apiFetch<unknown>("/rooms", {
    method: "POST",
    json: validatedPayload
  });
  return RoomSchema.parse(data);
}

// Update existing room
export async function updateRoom(id: string, payload: RoomUpdate): Promise<Room> {
  const data = await apiFetch<unknown>(`/rooms/${id}`, {
    method: "PATCH", // Backend uses PATCH not PUT
    json: payload
  });
  return RoomSchema.parse(data);
}

// Get single room
export async function getRoom(id: string): Promise<Room> {
  const data = await apiFetch<unknown>(`/rooms/${id}`);
  return RoomSchema.parse(data);
}

// Get room usage information
export async function getRoomUsage(id: string): Promise<RoomUsage> {
  const data = await apiFetch<unknown>(`/rooms/${id}/usage`);
  return RoomUsageSchema.parse(data);
}

// Delete room (soft delete)
export async function deleteRoom(id: string): Promise<void> {
  await apiFetch<void>(`/rooms/${id}`, { 
    method: "DELETE" 
  });
}