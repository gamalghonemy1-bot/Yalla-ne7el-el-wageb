'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try { await login(email.trim(), password); r.push('/assignments'); }
    catch (x: any) { setError(x.message); setBusy(false); }
  }
  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <form className="card" onSubmit={submit}>
        <h1>🦁 يلا نحل الواجب</h1>
        <label>البريد الإلكتروني</label>
        <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>كلمة المرور</label>
        <input type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="err">{error}</p>}
        <p><button className="btn" disabled={busy}>دخول</button></p>
      </form>
    </div>
  );
}
