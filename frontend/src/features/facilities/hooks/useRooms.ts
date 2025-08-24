// src/features/facilities/hooks/useRooms.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  listRooms, 
  createRoom, 
  updateRoom, 
  deleteRoom, 
  getRoom, 
  getRoomUsage 
} from "../services/rooms";
import { Room, RoomCreate, RoomUpdate, RoomUsage } from "@/schemas/facilities";

// Query keys for React Query
const queryKeys = {
  rooms: (params?: any) => ['rooms', params] as const,
  room: (id: string) => ['rooms', 'detail', id] as const,
  roomUsage: (id: string) => ['rooms', 'usage', id] as const
};

// Main hook for rooms management
export function useRooms(params?: {
  school_id?: string;
  room_type?: string;
  bookable_only?: boolean;
  available_only?: boolean;
  min_capacity?: number;
  has_projector?: boolean;
  has_computers?: boolean;
  has_smartboard?: boolean;
  has_sink?: boolean;
}) {
  const queryClient = useQueryClient();

  // List rooms with optional filtering
  const list = useQuery({
    queryKey: queryKeys.rooms(params),
    queryFn: () => listRooms(params),
    staleTime: 60_000, // 1 minute cache
  });

  // Create room mutation
  const create = useMutation({
    mutationFn: (payload: RoomCreate) => createRoom(payload),
    onSuccess: (newRoom) => {
      // Invalidate and refetch rooms list
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      // Optionally set the new room in cache
      queryClient.setQueryData(queryKeys.room(newRoom.id), newRoom);
    },
    onError: (error) => {
      console.error('Error creating room:', error);
    }
  });

  // Update room mutation
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RoomUpdate }) => 
      updateRoom(id, payload),
    onSuccess: (updatedRoom, { id }) => {
      // Update the specific room in cache
      queryClient.setQueryData(queryKeys.room(id), updatedRoom);
      // Invalidate rooms list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error) => {
      console.error('Error updating room:', error);
    }
  });

  // Delete room mutation
  const remove = useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.room(id) });
      queryClient.removeQueries({ queryKey: queryKeys.roomUsage(id) });
      // Invalidate rooms list
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error) => {
      console.error('Error deleting room:', error);
    }
  });

  return { 
    list, 
    create, 
    update, 
    remove,
    // Helper method to get room usage
    getRoomUsage: (id: string) => getRoomUsage(id)
  };
}

// Hook for single room details
export function useRoom(id: string) {
  return useQuery({
    queryKey: queryKeys.room(id),
    queryFn: () => getRoom(id),
    enabled: !!id,
    staleTime: 60_000
  });
}

// Hook for room usage information
export function useRoomUsage(id: string) {
  return useQuery({
    queryKey: queryKeys.roomUsage(id),
    queryFn: () => getRoomUsage(id),
    enabled: !!id,
    staleTime: 30_000 // 30 seconds cache for usage data
  });
}