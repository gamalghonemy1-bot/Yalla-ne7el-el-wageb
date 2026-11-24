export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export type User = { id: string; name: string; role: 'ADMIN' | 'TEACHER' | 'PARENT' };
export class ApiError extends Error { constructor(m: string, public status: number) { super(m); } }
const MSG: Record<number, string> = {
  400: 'بيانات غير صحيحة، راجع الحقول', 401: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  403: 'غير مسموح لك بهذا الإجراء', 404: 'غير موجود', 409: 'موجود بالفعل',
};
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}
export function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); }

export async function api<T = any>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  let res: Response;
  try {
    res = await fetch(API + path, {
      method: init.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch { throw new ApiError('تعذّر الاتصال بالخادم', 0); }
  if (res.status === 401 && token) { logout(); window.location.href = '/'; throw new ApiError('انتهت الجلسة', 401); }
  if (!res.ok) throw new ApiError(MSG[res.status] || 'حدث خطأ، حاول مرة أخرى', res.status);
  return (await res.json()) as T;
}
export async function login(email: string, password: string) {
  const d = await api<{ accessToken: string; user: User }>('/auth/login', { method: 'POST', body: { email, password } });
  if (d.user.role === 'PARENT') throw new ApiError('هذه اللوحة للمدير والمعلمات فقط', 403);
  localStorage.setItem('token', d.accessToken);
  localStorage.setItem('user', JSON.stringify(d.user));
}
