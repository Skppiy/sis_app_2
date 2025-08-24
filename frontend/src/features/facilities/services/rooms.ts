// src/features/facilities/services/rooms.ts
import { apiFetch } from "@api/requestHelper";
import { Room, RoomSchema } from "@schemas/facilities";
import { z } from "zod";

const RoomsListSchema = z.array(RoomSchema);

export async function listRooms(): Promise<Room[]> {
  const data = await apiFetch<unknown>("/rooms");
  return RoomsListSchema.parse(data);
}

export async function createRoom(payload: Partial<Room>) {
  const data = await apiFetch<unknown>("/rooms", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return RoomSchema.parse(data);
}

export async function updateRoom(id: string, payload: Partial<Room>) {
  const data = await apiFetch<unknown>(`/rooms/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return RoomSchema.parse(data);
}

export async function deleteRoom(id: string) {
  await apiFetch<void>(`/rooms/${id}`, { method: "DELETE" });
}
