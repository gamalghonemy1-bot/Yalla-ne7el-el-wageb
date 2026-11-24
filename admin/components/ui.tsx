'use client';
export function Loading({ error, data }: { error: string | null; data: unknown }) {
  if (error) return <p className="err">{error}</p>;
  if (!data) return <p>جاري التحميل...</p>;
  return null;
}
export function CheckList({ items, selected, onChange }: { items: { id: string; label: string }[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (<div>{items.map((i) => (
    <label className="check" key={i.id}>
      <input type="checkbox" checked={selected.includes(i.id)}
        onChange={(e) => onChange(e.target.checked ? [...selected, i.id] : selected.filter((x) => x !== i.id))} />
      {i.label}
    </label>))}</div>);
}
