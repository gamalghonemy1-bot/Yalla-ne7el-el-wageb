'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
type Opt = { text: string; isCorrect: boolean };
type Q = { text: string; options: Opt[] };
const newQ = (): Q => ({ text: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }] });
export default function NewAssignment() {
  const router = useRouter();
  const rooms = useLoad(() => api<any[]>('/classrooms'));
  const [title, setTitle] = useState(''); const [classroomId, setRoom] = useState(''); const [dueDate, setDue] = useState('');
  const [qs, setQs] = useState<Q[]>([newQ()]); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const upd = (i: number, f: (q: Q) => Q) => setQs(qs.map((q, k) => (k === i ? f(q) : q)));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (qs.some((q) => !q.text.trim() || q.options.some((o) => !o.text.trim()))) { setErr('املأ نص كل سؤال وكل اختيار'); return; }
    setBusy(true);
    try {
      await api('/assignments', { method: 'POST', body: { title, classroomId, ...(dueDate ? { dueDate: new Date(dueDate).toISOString() } : {}), questions: qs } });
      router.push('/assignments');
    } catch (x: any) { setErr(x.message); setBusy(false); }
  }
  return (<>
    <h1>واجب جديد</h1>
    <form onSubmit={submit}>
      <div className="card">
        <label>عنوان الواجب</label><input value={title} onChange={(e) => setTitle(e.target.value)} required />
        <label>الفصل</label>
        <select value={classroomId} onChange={(e) => setRoom(e.target.value)} required>
          <option value="">اختر الفصل</option>{rooms.data?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <label>موعد التسليم (اختياري)</label><input type="date" value={dueDate} onChange={(e) => setDue(e.target.value)} />
      </div>
      {qs.map((q, i) => (
        <div className="card" key={i}>
          <div className="row"><h2>سؤال {i + 1}</h2>
            {qs.length > 1 && <span className="fit"><button type="button" className="btn light" onClick={() => setQs(qs.filter((_, k) => k !== i))}>حذف</button></span>}</div>
          <input placeholder="نص السؤال" value={q.text} onChange={(e) => upd(i, (x) => ({ ...x, text: e.target.value }))} />
          <label>الاختيارات (حدد الإجابة الصحيحة)</label>
          {q.options.map((o, j) => (
            <div className="row" key={j} style={{ marginBottom: 6 }}>
              <span className="fit"><input type="radio" name={`c${i}`} checked={o.isCorrect}
                onChange={() => upd(i, (x) => ({ ...x, options: x.options.map((p, k) => ({ ...p, isCorrect: k === j })) }))} /></span>
              <input placeholder={`اختيار ${j + 1}`} value={o.text}
                onChange={(e) => upd(i, (x) => ({ ...x, options: x.options.map((p, k) => (k === j ? { ...p, text: e.target.value } : p)) }))} />
            </div>))}
        </div>))}
      <p><button type="button" className="btn light" onClick={() => setQs([...qs, newQ()])}>+ إضافة سؤال</button></p>
      {err && <p className="err">{err}</p>}
      <p><button className="btn" disabled={busy}>حفظ وإرسال للفصل</button></p>
    </form>
  </>);
}
