import { useMemo, useState } from "react";
import { FlaskConical, LayoutGrid, List, Plus } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { useI18n } from "../../../../i18n/I18nContext";
import { ControlPanel } from "../../../../shared/components/odoo/ControlPanel";
import { ListView } from "../../../../shared/components/odoo/ListView";
import { ErrorState } from "../../../../shared/components/ui";
import { OPPORTUNITY_STAGES } from "../types/opportunity.types";
import { OPPORTUNITIES_ARE_SAMPLE, useOpportunities, useOpportunityActions } from "../hooks/useOpportunities";
import { OpportunityCard, PriorityStars } from "./OpportunityCard";
import { OpportunityFormDialog } from "./OpportunityFormDialog";
import { SalesOrdersKanbanSkeleton } from "../../components/orders/SalesOrdersKanban";
import "../../styles/sales.css";

// Stage accents, from the existing theme tokens only.
const STAGE_TONE = {
  New: { bar: "bg-line-strong", dot: "bg-subtle", amount: "text-ink" },
  Negotiation: { bar: "bg-warning", dot: "bg-warning", amount: "text-warning" },
  Proposal: { bar: "bg-accent", dot: "bg-accent", amount: "text-ink" },
  Won: { bar: "bg-success", dot: "bg-success", amount: "text-success" },
};
const NEUTRAL_TONE = STAGE_TONE.New;

function sumRevenue(rows) {
  if (!rows.length) return null;
  return formatMoney(
    rows.reduce((sum, row) => sum + Number(row.expectedRevenue), 0),
    rows[0].currencyCode,
    0,
  );
}

// Sales opportunities pipeline (CRM): a header, the Odoo control panel (New / search / filters /
// group by / kanban-list), then stage columns whose cards can be dragged from one stage to another.
// Runs on sample data until an opportunities API exists (see hooks/useOpportunities.ts) -- a notice
// says so on the page.
export function OpportunitiesView({ companyId, currencyCode }) {
  const { t } = useI18n();
  const opportunitiesQuery = useOpportunities(companyId, currencyCode);
  const actions = useOpportunityActions(companyId);
  const opportunities = useMemo(() => opportunitiesQuery.data ?? [], [opportunitiesQuery.data]);

  const [search, setSearch] = useState("");
  const [starredOnly, setStarredOnly] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [groupBy, setGroupBy] = useState("stage");
  const [view, setView] = useState("kanban");
  const [form, setForm] = useState(null); // { opportunity } | { initialStage }
  const [draggingId, setDraggingId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const tags = useMemo(
    () => [...new Set(opportunities.map((entry) => entry.tag).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [opportunities],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return opportunities.filter((entry) => {
      if (starredOnly && entry.priority === 0) return false;
      if (tagFilter && entry.tag !== tagFilter) return false;
      if (!term) return true;
      return [entry.customerName, entry.salespersonName, entry.tag, entry.email, entry.phone]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [opportunities, search, starredOnly, tagFilter]);

  // Stage grouping always shows all four stages (drop targets even when empty); other groupings
  // show only the groups that have something.
  const columns = useMemo(() => {
    if (groupBy === "stage") {
      return OPPORTUNITY_STAGES.map((stage) => ({
        key: stage,
        label: t(`opportunities.stage.${stage}`),
        tone: STAGE_TONE[stage],
        rows: visible.filter((entry) => entry.stage === stage),
      }));
    }
    const field = groupBy === "salesperson" ? "salespersonName" : "tag";
    const map = new Map();
    for (const entry of visible) {
      const key = entry[field] || "—";
      if (!map.has(key)) map.set(key, { key, label: key, tone: NEUTRAL_TONE, rows: [] });
      map.get(key).rows.push(entry);
    }
    return [...map.values()];
  }, [groupBy, visible, t]);

  const canDrop = groupBy === "stage";
  const drop = (stage) => {
    if (draggingId) actions.moveToStage(draggingId, stage);
    setDraggingId(null);
    setDropTarget(null);
  };

  const facets = [
    starredOnly && { id: "starred", label: t("opportunities.filter.starred"), onRemove: () => setStarredOnly(false) },
    tagFilter && { id: "tag", label: tagFilter, onRemove: () => setTagFilter("") },
    groupBy !== "stage" && {
      id: "group",
      label: `${t("odoo.groupBy")}: ${t(`opportunities.groupBy.${groupBy}`)}`,
      onRemove: () => setGroupBy("stage"),
    },
  ].filter(Boolean);

  const submitForm = (draft) => {
    if (form?.opportunity) actions.save({ ...form.opportunity, ...draft });
    else actions.create(draft);
    setForm(null);
  };

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-[var(--shadow-surface)]">
        <div className="min-w-0">
          <h1 className="sales-display text-2xl font-black text-ink">{t("opportunities.title")}</h1>
          <p className="text-sm text-muted">{t("opportunities.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ initialStage: "New" })}
          className="flex h-10 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-bold text-surface shadow-sm transition hover:opacity-90"
        >
          <Plus size={16} />
          {t("opportunities.new")}
        </button>
      </header>

      {OPPORTUNITIES_ARE_SAMPLE && (
        <div className="flex items-start gap-2 rounded-xl border border-warning bg-warning-soft px-3 py-2 text-sm text-warning">
          <FlaskConical size={16} className="mt-0.5 shrink-0" />
          <p>{t("opportunities.sampleNotice")}</p>
        </div>
      )}

      <ControlPanel
        breadcrumbs={[t("nav.sales"), t("salesOrders.tabs.opportunities")]}
        search={{ value: search, onChange: setSearch, placeholder: t("opportunities.search") }}
        facets={facets}
        filters={[
          [{ id: "starred", label: t("opportunities.filter.starred"), active: starredOnly, onToggle: () => setStarredOnly((v) => !v) }],
          tags.map((tag) => ({
            id: `tag-${tag}`,
            label: tag,
            active: tagFilter === tag,
            onToggle: () => setTagFilter((current) => (current === tag ? "" : tag)),
          })),
        ].filter((section) => section.length)}
        groupBy={["stage", "salesperson", "tag"].map((value) => ({
          id: value,
          label: t(`opportunities.groupBy.${value}`),
          active: groupBy === value,
          onSelect: () => setGroupBy(value),
        }))}
        views={{
          current: view,
          onChange: setView,
          options: [
            { id: "kanban", label: t("odoo.view.kanban"), icon: LayoutGrid },
            { id: "list", label: t("odoo.view.list"), icon: List },
          ],
        }}
      />

      {opportunitiesQuery.isLoading && <SalesOrdersKanbanSkeleton />}
      {opportunitiesQuery.isError && <ErrorState title={t("salesOrders.error.title")} message={t("salesOrders.error.message")} />}

      {opportunitiesQuery.data && view === "kanban" && (
        <>
          {canDrop && <p className="text-xs text-subtle">{t("opportunities.dragHint")}</p>}
          <div className="-mx-1 overflow-x-auto pb-2">
            <div className="flex min-w-full items-start gap-3 px-1">
              {columns.map((column) => {
                const isTarget = canDrop && dropTarget === column.key;
                return (
                  <section
                    key={column.key}
                    aria-label={column.label}
                    onDragOver={
                      canDrop
                        ? (event) => {
                            event.preventDefault();
                            if (dropTarget !== column.key) setDropTarget(column.key);
                          }
                        : undefined
                    }
                    onDragLeave={canDrop ? (event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget(null);
                    } : undefined}
                    onDrop={canDrop ? (event) => {
                      event.preventDefault();
                      drop(column.key);
                    } : undefined}
                    className={`flex min-w-[16.5rem] flex-1 flex-col overflow-hidden rounded-xl border bg-raised transition ${
                      isTarget ? "border-accent-line ring-2 ring-accent-line" : "border-line"
                    }`}
                  >
                    <div className={`h-1 ${column.tone.bar}`} />
                    <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-bold text-ink">
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${column.tone.dot}`} />
                          <span className="truncate">{column.label}</span>
                        </div>
                        <div className={`sales-display pos-num text-sm font-extrabold ${column.tone.amount}`}>
                          {sumRevenue(column.rows) ?? "—"}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {canDrop && (
                          <button
                            type="button"
                            onClick={() => setForm({ initialStage: column.key })}
                            aria-label={`${t("opportunities.new")} · ${column.label}`}
                            title={t("opportunities.new")}
                            className="grid h-7 w-7 place-items-center rounded-full text-muted transition hover:bg-hover hover:text-ink"
                          >
                            <Plus size={15} />
                          </button>
                        )}
                        <span className="sales-display pos-num grid h-7 min-w-7 place-items-center rounded-full border border-line bg-surface px-2 text-sm font-bold text-ink">
                          {column.rows.length}
                        </span>
                      </div>
                    </header>
                    <div className="flex max-h-[calc(100dvh-22rem)] min-h-24 flex-col gap-2 overflow-y-auto p-2">
                      {column.rows.length === 0 ? (
                        <p className="py-8 text-center text-xs font-bold text-subtle">{t("opportunities.empty")}</p>
                      ) : (
                        column.rows.map((opportunity) => (
                          <OpportunityCard
                            key={opportunity.opportunityId}
                            opportunity={opportunity}
                            isDragging={draggingId === opportunity.opportunityId}
                            onOpen={() => setForm({ opportunity })}
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = "move";
                              event.dataTransfer.setData("text/plain", opportunity.opportunityId);
                              setDraggingId(opportunity.opportunityId);
                            }}
                            onDragEnd={() => {
                              setDraggingId(null);
                              setDropTarget(null);
                            }}
                          />
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </>
      )}

      {opportunitiesQuery.data && view === "list" && (
        <ListView
          columns={[
            { key: "customer", header: t("opportunities.field.customer"), render: (row) => <span className="font-bold">{row.customerName}</span> },
            { key: "stage", header: t("opportunities.field.stage"), render: (row) => t(`opportunities.stage.${row.stage}`) },
            { key: "salesperson", header: t("opportunities.field.salesperson"), render: (row) => row.salespersonName || "—" },
            { key: "tag", header: t("opportunities.field.tag"), render: (row) => row.tag || "—" },
            { key: "priority", header: t("opportunities.field.priority"), render: (row) => <PriorityStars value={row.priority} /> },
            {
              key: "revenue",
              header: t("opportunities.field.revenue"),
              align: "end",
              render: (row) => <span className="font-bold">{formatMoney(row.expectedRevenue, row.currencyCode, 0)}</span>,
              sum: (rows) => sumRevenue(rows),
            },
          ]}
          rows={groupBy === "stage" ? visible : undefined}
          groups={groupBy === "stage" ? undefined : columns}
          getRowKey={(row) => row.opportunityId}
          onRowClick={(row) => setForm({ opportunity: row })}
          emptyLabel={t("opportunities.empty")}
        />
      )}

      {form && (
        <OpportunityFormDialog
          opportunity={form.opportunity ?? null}
          initialStage={form.initialStage}
          currencyCode={currencyCode || "SAR"}
          onSubmit={submitForm}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}
