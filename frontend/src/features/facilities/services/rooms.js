// src/features/facilities/services/rooms.ts
import { apiFetch } from "@/api/requestHelper";
import { RoomSchema, RoomCreateSchema, RoomUsageSchema } from "@/schemas/facilities";
import { z } from "zod";
const RoomsListSchema = z.array(RoomSchema);
// List rooms with optional filtering
export async function listRooms(params) {
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
    const data = await apiFetch(url);
    return RoomsListSchema.parse(data);
}
// Create new room
export async function createRoom(payload) {
    // Validate payload against schema
    const validatedPayload = RoomCreateSchema.parse(payload);
    const data = await apiFetch("/rooms", {
        method: "POST",
        json: validatedPayload
    });
    return RoomSchema.parse(data);
}
// Update existing room
export async function updateRoom(id, payload) {
    const data = await apiFetch(`/rooms/${id}`, {
        method: "PATCH", // Backend uses PATCH not PUT
        json: payload
    });
    return RoomSchema.parse(data);
}
// Get single room
export async function getRoom(id) {
    const data = await apiFetch(`/rooms/${id}`);
    return RoomSchema.parse(data);
}
// Get room usage information
export async function getRoomUsage(id) {
    const data = await apiFetch(`/rooms/${id}/usage`);
    return RoomUsageSchema.parse(data);
}
// Delete room (soft delete)
export async function deleteRoom(id) {
    await apiFetch(`/rooms/${id}`, {
        method: "DELETE"
    });
}
