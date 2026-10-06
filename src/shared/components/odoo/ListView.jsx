import "./odoo.css";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Odoo-style list view: plain rows with hairline separators, bold header, numeric columns
// end-aligned, the whole row clickable. With `groups`, rows are shown under collapsible group
// headers (label, record count and per-group totals for any column with `sum`), like Odoo's
// "Group By". Theme-aware (semantic tokens only). Scrolls sideways inside itself on narrow screens.
//
//   columns  [{ key, header, render(row), align: "start" | "end", className, sum(rows) }]
//   rows     records (ungrouped)        | groups [{ key, label, rows }]
export function ListView({ columns, rows, groups, getRowKey, onRowClick, emptyLabel }) {
  const isGrouped = Array.isArray(groups);
  const isEmpty = isGrouped ? groups.length === 0 : !rows?.length;

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-[var(--shadow-surface)]">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line-strong bg-raised">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`whitespace-nowrap px-3 py-2.5 text-xs font-bold text-muted ${
                  column.align === "end" ? "text-end" : "text-start"
                } ${column.className || ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-subtle">
                {emptyLabel}
              </td>
            </tr>
          )}
          {!isGrouped &&
            rows?.map((row) => (
              <Row key={getRowKey(row)} row={row} columns={columns} onRowClick={onRowClick} />
            ))}
          {isGrouped &&
            groups.map((group) => (
              <Group key={group.key} group={group} columns={columns} getRowKey={getRowKey} onRowClick={onRowClick} />
            ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ row, columns, onRowClick }) {
  return (
    <tr
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      onKeyDown={
        onRowClick
          ? (event) => {
              if (event.key === "Enter") onRowClick(row);
            }
          : undefined
      }
      tabIndex={onRowClick ? 0 : undefined}
      className={`border-b border-line last:border-0 ${
        onRowClick ? "cursor-pointer transition hover:bg-hover focus-visible:bg-hover focus-visible:outline-none" : ""
      }`}
    >
      {columns.map((column) => (
        <td
          key={column.key}
          className={`px-3 py-2 text-ink ${column.align === "end" ? "pos-num text-end" : "text-start"} ${column.className || ""}`}
        >
          {column.render(row)}
        </td>
      ))}
    </tr>
  );
}

function Group({ group, columns, getRowKey, onRowClick }) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <tr className="border-b border-line bg-inset">
        {columns.map((column, index) => (
          <td
            key={column.key}
            className={`px-3 py-2 text-sm font-bold ${column.align === "end" ? "pos-num text-end" : "text-start"}`}
          >
            {index === 0 ? (
              <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className="flex items-center gap-1.5 text-ink"
              >
                <ChevronDown size={15} className={`transition-transform ${open ? "" : "-rotate-90 rtl:rotate-90"}`} />
                <span className="truncate">{group.label}</span>
                <span className="pos-num font-normal text-subtle">({group.rows.length})</span>
              </button>
            ) : column.sum ? (
              <span className="text-ink">{column.sum(group.rows)}</span>
            ) : null}
          </td>
        ))}
      </tr>
      {open && group.rows.map((row) => <Row key={getRowKey(row)} row={row} columns={columns} onRowClick={onRowClick} />)}
    </>
  );
}
