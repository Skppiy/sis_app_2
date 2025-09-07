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
import type { RoomCreate, RoomUpdate } from "@/schemas/facilities";
import { queryKeys } from '@/api/queryKeys';

// Hook to list rooms
export function useRooms(filters?: {
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
  return useQuery({
    queryKey: queryKeys.rooms.list(filters),
    queryFn: () => listRooms(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get a specific room
export function useRoom(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.rooms.detail(id!),
    queryFn: () => getRoom(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to create a room
export function useCreateRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.lists() });
    },
  });
}

// Hook to update a room
export function useUpdateRoom(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: RoomUpdate) => updateRoom(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.lists() });
    },
  });
}

// Hook to delete a room
export function useDeleteRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.lists() });
    },
  });
}

// Hook for room usage information
export function useRoomUsage(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.rooms.usage(id!),
    queryFn: () => getRoomUsage(id!),
    enabled: !!id,
    staleTime: 30_000, // 30 seconds cache for usage data
  });
}