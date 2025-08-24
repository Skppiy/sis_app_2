import { apiFetch } from '@api/requestHelper';
import { AcademicYear, AcademicYearCreate, AcademicYearUpdate } from '../schemas/years';

export const YearsAPI = {
  list: () => apiFetch<AcademicYear[]>('/academic-years'),
  create: (data: AcademicYearCreate) =>
    apiFetch<AcademicYear>('/academic-years', { method: 'POST', json: data }),
  update: (id: string, data: AcademicYearUpdate) =>
    apiFetch<AcademicYear>(`/academic-years/${id}`, { method: 'PUT', json: data }),
  remove: (id: string) =>
    apiFetch<void>(`/academic-years/${id}`, { method: 'DELETE' }),
};
