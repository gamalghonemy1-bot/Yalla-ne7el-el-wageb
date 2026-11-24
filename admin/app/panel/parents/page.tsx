'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import { CheckList } from '@/components/ui';
export default function Page() {
  const src = useLoad(() => api<any[]>('/children'));
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState('');
  const [ids, setIds] = useState<string[]>([]); const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setOk('');
    try {
      await api('/parents', { method: 'POST', body: { email, password, name, childIds: ids } });
      setOk('تمت الإضافة: ' + name); setEmail(''); setPassword(''); setName(''); setIds([]);
    } catch (x: any) { setErr(x.message); }
  }
  return (<>
    <h1>أولياء الأمور</h1>
    <form className="card" onSubmit={add}>
      <label>الاسم</label><input value={name} onChange={(e) => setName(e.target.value)} required />
      <label>البريد الإلكتروني</label><input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <label>كلمة المرور (8 أحرف على الأقل)</label><input type="password" dir="ltr" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
      <label>الأطفال المرتبطون</label>
      <CheckList items={(src.data ?? []).map((c) => ({ id: c.id, label: `${c.name} – ${c.classroom?.name}` }))} selected={ids} onChange={setIds} />
      {err && <p className="err">{err}</p>}{ok && <p className="ok">{ok}</p>}
      <p><button className="btn">إضافة ولي أمر</button></p>
    </form>
  </>);
}
