// src/features/facilities/hooks/useRooms.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createRoom, deleteRoom, listRooms, updateRoom } from "../services/rooms";

const qk = { rooms: ["rooms"] as const };

export function useRooms() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: qk.rooms, queryFn: listRooms, staleTime: 60_000 });

  const create = useMutation({
    mutationFn: createRoom,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.rooms }),
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateRoom(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.rooms }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.rooms }),
  });

  return { list, create, update, remove };
}
