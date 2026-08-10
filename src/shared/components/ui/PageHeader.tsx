import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
};

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="brand-text text-xl font-black">{title}</h1>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
