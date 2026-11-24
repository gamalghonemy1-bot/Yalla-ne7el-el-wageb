'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUser, logout, User } from '@/lib/api';
const NAV = [
  { href: '/assignments', label: 'الواجبات', roles: ['ADMIN', 'TEACHER'] },
  { href: '/classrooms', label: 'الفصول', roles: ['ADMIN', 'TEACHER'] },
  { href: '/children', label: 'الأطفال', roles: ['ADMIN', 'TEACHER'] },
  { href: '/parents', label: 'أولياء الأمور', roles: ['ADMIN'] },
  { href: '/teachers', label: 'المعلمات', roles: ['ADMIN'] },
];
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const path = usePathname();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { const u = getUser(); if (!u) router.replace('/'); else setUser(u); }, [router]);
  if (!user) return null;
  return (<>
    <nav className="nav">
      {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
        <Link key={n.href} href={n.href} className={path.startsWith(n.href) ? 'on' : ''}>{n.label}</Link>))}
      <span className="sp" />
      <span style={{ color: '#fff' }}>{user.name}</span>
      <button onClick={() => { logout(); router.replace('/'); }}>خروج</button>
    </nav>
    <main className="wrap">{children}</main>
  </>);
}
