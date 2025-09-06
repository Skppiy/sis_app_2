import { apiFetch } from '@api/requestHelper';
export const YearsAPI = {
    list: () => apiFetch('/academic-years'),
    create: (data) => apiFetch('/academic-years', { method: 'POST', json: data }),
    update: (id, data) => apiFetch(`/academic-years/${id}`, { method: 'PUT', json: data }),
    remove: (id) => apiFetch(`/academic-years/${id}`, { method: 'DELETE' }),
};
