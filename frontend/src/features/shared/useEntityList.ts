// src/features/shared/useEntityList.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/requestHelper";

export function useEntityList<T>(path: string, queryKey: (string | number)[]) {
  return useQuery({
    queryKey,
    queryFn: () => apiFetch<T[]>(path),
  });
}
