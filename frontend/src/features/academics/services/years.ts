// src/features/academics/services/years.ts
import { apiFetch } from "@/api/requestHelper";

export type AcademicYear = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

export type AcademicYearCreate = Omit<AcademicYear, "id">;
export type AcademicYearUpdate = Partial<Omit<AcademicYear, "id">>;

export const YearsAPI = {
  list: () => apiFetch<AcademicYear[]>("/academic-years"),
  create: (data: AcademicYearCreate) =>
    apiFetch<AcademicYear>("/academic-years", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: AcademicYearUpdate) =>
    apiFetch<AcademicYear>(`/academic-years/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiFetch<void>(`/academic-years/${id}`, { method: "DELETE" }),
};
