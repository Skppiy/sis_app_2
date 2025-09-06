import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { YearsAPI } from '../services/years';
import { qk } from '@/qk';
export function useYears() {
    const qc = useQueryClient();
    const list = useQuery({ queryKey: qk.years, queryFn: YearsAPI.list, staleTime: 30_000 });
    const create = useMutation({
        mutationFn: (data) => YearsAPI.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: qk.years }),
    });
    const update = useMutation({
        mutationFn: ({ id, data }) => YearsAPI.update(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: qk.years }),
    });
    const remove = useMutation({
        mutationFn: (id) => YearsAPI.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: qk.years }),
    });
    return { list, create, update, remove };
}
