// src/features/academics/hooks/useClassrooms.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClassroom, deleteClassroom, listClassrooms, updateClassroom } from "../services/classrooms";

const qk = { classrooms: ["classrooms"] as const };

export function useClassrooms() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: qk.classrooms, queryFn: listClassrooms, staleTime: 60_000 });

  const create = useMutation({
    mutationFn: createClassroom,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.classrooms }),
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateClassroom(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.classrooms }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteClassroom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.classrooms }),
  });

  return { list, create, update, remove };
}
