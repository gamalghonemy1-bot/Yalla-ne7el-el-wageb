'use client';
import { useState } from 'react';
import { api, getUser } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import { Loading } from '@/components/ui';
export default function ChildrenPage() {
  const kids = useLoad(() => api<any[]>('/children'));
  const rooms = useLoad(() => api<any[]>('/classrooms'));
  const [name, setName] = useState(''); const [classroomId, setRoom] = useState(''); const [birthDate, setBirth] = useState('');
  const [err, setErr] = useState('');
  const isAdmin = getUser()?.role === 'ADMIN';
  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    try {
      await api('/children', { method: 'POST', body: { name, classroomId, ...(birthDate ? { birthDate } : {}) } });
      setName(''); setBirth(''); kids.reload();
    } catch (x: any) { setErr(x.message); }
  }
  return (<>
    <h1>الأطفال</h1>
    {isAdmin && <form className="card" onSubmit={add}>
      <label>اسم الطفل</label><input value={name} onChange={(e) => setName(e.target.value)} required />
      <label>الفصل</label>
      <select value={classroomId} onChange={(e) => setRoom(e.target.value)} required>
        <option value="">اختر الفصل</option>{rooms.data?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
      <label>تاريخ الميلاد (اختياري)</label><input type="date" value={birthDate} onChange={(e) => setBirth(e.target.value)} />
      {err && <p className="err">{err}</p>}
      <p><button className="btn">إضافة طفل</button></p>
    </form>}
    <div className="card"><Loading error={kids.error} data={kids.data} />
      {kids.data && <table><thead><tr><th>الاسم</th><th>الفصل</th></tr></thead>
        <tbody>{kids.data.map((c) => <tr key={c.id}><td>{c.name}</td><td>{c.classroom?.name}</td></tr>)}</tbody></table>}
    </div>
  </>);
}
