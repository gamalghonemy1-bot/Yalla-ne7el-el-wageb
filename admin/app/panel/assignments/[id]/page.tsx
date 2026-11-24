'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import { Loading } from '@/components/ui';
const STATUS: Record<string, string> = { PENDING: 'لم يبدأ', IN_PROGRESS: 'قيد الحل', COMPLETED: 'مكتمل' };
export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error } = useLoad(() => api<any>(`/results/assignments/${id}`));
  const done = (c: any) => c.status === 'COMPLETED';
  return (<>
    <p><Link href="/assignments">← الواجبات</Link></p>
    <Loading error={error} data={data} />
    {data && <><h1>نتائج: {data.title}</h1>
      <div className="card"><table>
        <thead><tr><th>الطفل</th><th>الحالة</th><th>النقاط</th><th>صحيحة</th><th>خاطئة</th></tr></thead>
        <tbody>{data.children.map((c: any) => (<tr key={c.childId}><td>{c.name}</td><td>{STATUS[c.status]}</td>
          <td>{done(c) ? c.score : '—'}</td><td>{done(c) ? c.correctCount : '—'}</td><td>{done(c) ? c.wrongCount : '—'}</td></tr>))}</tbody>
      </table></div></>}
  </>);
}
