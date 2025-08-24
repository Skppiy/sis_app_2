export type ApiInit = (RequestInit & {
  json?: unknown;
  form?: Record<string, string>;
}) | undefined;

function buildRequest(init: ApiInit): RequestInit {
  const headers = new Headers(init?.headers);
  let body: BodyInit | undefined;

  if (init?.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  } else if (init?.form) {
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
    const params = new URLSearchParams();
    Object.entries(init.form).forEach(([k, v]) => params.append(k, v));
    body = params.toString();
  }

  return { ...init, headers, body };
}

const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

export async function apiFetch<T>(path: string, init?: ApiInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers((init as RequestInit | undefined)?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, buildRequest({ ...init, headers }));
  if (res.status === 401) {
    localStorage.removeItem('token');
    // bubble up for UI to redirect to /login
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? (await res.json()) as T : (undefined as unknown as T);
}

export const request = apiFetch; // alias for compatibility
