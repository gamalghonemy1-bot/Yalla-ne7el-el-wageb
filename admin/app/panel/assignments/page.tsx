'use client';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import { Loading } from '@/components/ui';
export default function AssignmentsPage() {
  const { data, error } = useLoad(() => api<any[]>('/assignments'));
  return (<>
    <div className="row"><h1>الواجبات</h1><span className="fit"><Link className="btn" href="/assignments/new">+ واجب جديد</Link></span></div>
    <div className="card"><Loading error={error} data={data} />
      {data && (data.length === 0 ? <p>لا توجد واجبات بعد.</p> :
        <table><thead><tr><th>العنوان</th><th>الفصل</th><th>الأسئلة</th><th>التسليم</th><th /></tr></thead>
          <tbody>{data.map((a) => (<tr key={a.id}><td>{a.title}</td><td>{a.classroom}</td><td>{a.questionCount}</td>
            <td>{a.dueDate ? a.dueDate.slice(0, 10) : '—'}</td><td><Link href={`/assignments/${a.id}`}>النتائج</Link></td></tr>))}</tbody></table>)}
    </div>
  </>);
}
