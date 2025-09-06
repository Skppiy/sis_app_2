// src/features/shared/useEntityList.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/requestHelper";
export function useEntityList(path, queryKey) {
    return useQuery({
        queryKey,
        queryFn: () => apiFetch(path),
    });
}
