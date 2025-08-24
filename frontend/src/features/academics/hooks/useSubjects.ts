// src/features/academics/hooks/useSubjects.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSubject, deleteSubject, listSubjects, updateSubject } from "../services/subjects";

const qk = { subjects: ["subjects"] as const };

export function useSubjects() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: qk.subjects, queryFn: listSubjects, staleTime: 60_000 });

  const create = useMutation({
    mutationFn: createSubject,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subjects }),
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateSubject(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subjects }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subjects }),
  });

  return { list, create, update, remove };
}
