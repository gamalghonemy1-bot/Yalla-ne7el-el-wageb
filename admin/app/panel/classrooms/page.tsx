'use client';
import { useState } from 'react';
import { api, getUser } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import { Loading } from '@/components/ui';
export default function ClassroomsPage() {
  const { data, error, reload } = useLoad(() => api<any[]>('/classrooms'));
  const [name, setName] = useState(''); const [err, setErr] = useState('');
  const isAdmin = getUser()?.role === 'ADMIN';
  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    try { await api('/classrooms', { method: 'POST', body: { name } }); setName(''); reload(); } catch (x: any) { setErr(x.message); }
  }
  return (<>
    <h1>الفصول</h1>
    {isAdmin && <form className="card" onSubmit={add}>
      <div className="row"><input placeholder="اسم الفصل (مثال: KG1-A)" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="btn fit">إضافة فصل</button></div>
      {err && <p className="err">{err}</p>}
    </form>}
    <div className="card"><Loading error={error} data={data} />
      {data && <table><thead><tr><th>الفصل</th></tr></thead><tbody>{data.map((c) => <tr key={c.id}><td>{c.name}</td></tr>)}</tbody></table>}
    </div>
  </>);
}
