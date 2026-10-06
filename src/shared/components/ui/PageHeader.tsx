import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
};

// Odoo-style app bar: the page / module name in plain text on a light bar, actions on the other
// side. Theme-aware (semantic tokens), so it takes the Odoo colours inside `.odoo-root`.
export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-[var(--shadow-surface)]">
      <h1 className="text-lg font-bold text-ink">{title}</h1>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
