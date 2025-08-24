// src/config/env.ts
export const env = {
    apiBase: import.meta.env.VITE_API_BASE ?? "http://localhost:8000",
    authBypass: (import.meta.env.VITE_AUTH_BYPASS ?? "false").toLowerCase() === "true",
  };
  