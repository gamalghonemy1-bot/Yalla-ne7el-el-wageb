import './globals.css';
import { Cairo } from 'next/font/google';
const cairo = Cairo({ subsets: ['arabic', 'latin'] });
export const metadata = { title: 'يلا نحل الواجب – لوحة الإدارة' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="ar" dir="rtl"><body className={cairo.className}>{children}</body></html>);
}
