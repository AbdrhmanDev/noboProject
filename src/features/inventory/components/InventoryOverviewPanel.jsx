import { useMemo, useState } from "react";
import { ArrowLeftRight, MapPin, PackageCheck, PackageX, RotateCcw, ShoppingCart, Boxes, TriangleAlert } from "lucide-react";
import { subDays } from "date-fns";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { useI18n } from "../../../i18n/I18nContext";
import { ListView } from "../../../shared/components/odoo/ListView";
import { StatusPill } from "../../../shared/components/odoo/StatusBar";
import {
  useInventoryLocationStock,
  useInventoryLocations,
  useInventoryStockTransactions,
} from "../hooks/useInventory";

const ATTENTION_LIMIT = 8;
const RECENT_LIMIT = 8;

// One card per stock movement type, like Odoo Inventory's operation-type cards.
const OPERATIONS = [
  { type: "ManualAdjustment", icon: ArrowLeftRight, tone: "info" },
  { type: "SalesConsumption", icon: ShoppingCart, tone: "warning" },
  { type: "SalesReversal", icon: RotateCcw, tone: "success" },
];
const TYPE_TONE = Object.fromEntries(OPERATIONS.map((operation) => [operation.type, operation.tone]));

function quantity(item) {
  return Number(item.quantityOnHand);
}

function formatQuantity(item) {
  return `${quantity(item).toLocaleString("en-US", { maximumFractionDigits: 3 })} ${item.baseUnitOfMeasure?.symbol ?? ""}`.trim();
}

function KpiCard({ icon: Icon, label, value, tone = "ink" }) {
  const toneClass = { ink: "text-ink", success: "text-success", warning: "text-warning", danger: "text-danger" }[tone];
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-[var(--shadow-surface)]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-inset text-muted">
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <div className="odoo-title truncate text-sm">{label}</div>
        <div className={`pos-num text-2xl font-normal ${toneClass}`}>{value}</div>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="min-w-0 rounded-xl border border-line bg-surface p-3.5 shadow-[var(--shadow-surface)]">
      <h2 className="odoo-title mb-2.5 border-b border-line pb-2 text-base">{title}</h2>
      {children}
    </section>
  );
}

// "N movements in the last 7 days" for one movement type -- a 1-row page just for its totalCount.
function OperationCard({ companyId, branchId, canView, operation, sinceUtc, onOpen }) {
  const { t } = useI18n();
  const query = useInventoryStockTransactions(
    companyId,
    branchId,
    { transactionType: operation.type, createdFromUtc: sinceUtc, pageNumber: 1, pageSize: 1 },
    canView,
  );
  const Icon = operation.icon;

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-[var(--shadow-surface)]">
      <div className="flex items-center gap-2">
        <Icon size={18} className="shrink-0 text-accent" />
        <span className="truncate font-bold text-ink">{t(`inventory.type.${operation.type}`)}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpen(operation.type)}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-bold text-white transition hover:bg-accent-strong"
        >
          {t("inventory.overview.viewMovements")}
        </button>
        <div className="text-end">
          <div className="pos-num text-xl font-black text-ink">{query.isLoading ? "…" : (query.data?.totalCount ?? "—")}</div>
          <div className="text-[11px] text-subtle">{t("inventory.overview.last7Days")}</div>
        </div>
      </div>
    </div>
  );
}

// Inventory overview (Odoo Inventory's landing dashboard): stock health KPIs for one location,
// movement cards per type (last 7 days), the items that need attention (zero / negative stock),
// the lowest positive balances, and the latest movements. Read-only, built only on existing
// endpoints (location stock + stock transactions). "Low" is shown as "lowest balances" on purpose:
// items have no reorder level to compare against.
export function InventoryOverviewPanel({ companyId, branchId, canView, onOpenLedger }) {
  const { t } = useI18n();
  const locationsQuery = useInventoryLocations(companyId, branchId, {}, canView);
  const locations = useMemo(
    () => (locationsQuery.data ?? []).filter((location) => location.status !== "Suspended"),
    [locationsQuery.data],
  );
  const [pickedLocationId, setPickedLocationId] = useState("");
  const locationId =
    pickedLocationId ||
    locations.find((location) => location.isDefault)?.inventoryLocationId ||
    locations[0]?.inventoryLocationId ||
    "";

  const stockQuery = useInventoryLocationStock(companyId, branchId, locationId, canView && Boolean(locationId));
  const items = useMemo(() => stockQuery.data?.items ?? [], [stockQuery.data]);

  const [sinceUtc] = useState(() => subDays(new Date(), 7).toISOString());
  const recentQuery = useInventoryStockTransactions(
    companyId,
    branchId,
    { pageNumber: 1, pageSize: RECENT_LIMIT },
    canView,
  );

  const stats = useMemo(() => {
    const inStock = items.filter((item) => quantity(item) > 0);
    return {
      total: items.length,
      inStock: inStock.length,
      out: items.filter((item) => quantity(item) === 0).length,
      negative: items.filter((item) => quantity(item) < 0).length,
      attention: items
        .filter((item) => quantity(item) <= 0)
        .sort((a, b) => quantity(a) - quantity(b))
        .slice(0, ATTENTION_LIMIT),
      lowest: inStock.sort((a, b) => quantity(a) - quantity(b)).slice(0, ATTENTION_LIMIT),
    };
  }, [items]);

  if (locationsQuery.isLoading) return <LoadingState label={t("inventory.overview.loading")} />;
  if (!locations.length) {
    return <EmptyState title={t("inventory.overview.noLocations.title")} message={t("inventory.overview.noLocations.message")} />;
  }

  const itemRow = (item, tone) => (
    <li key={item.inventoryItemId} className="flex items-center justify-between gap-2 border-b border-line py-1.5 last:border-0">
      <span className="min-w-0 truncate text-sm text-ink" title={item.name}>
        {item.name} <span className="text-xs text-subtle">· {item.code}</span>
      </span>
      <span className={`pos-num shrink-0 text-sm font-bold ${tone}`}>{formatQuantity(item)}</span>
    </li>
  );

  return (
    <div className="space-y-3">
      {locations.length > 1 && (
        <label className="flex w-fit items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-muted">
          <MapPin size={15} className="text-accent" />
          {t("inventory.overview.location")}
          <select
            value={locationId}
            onChange={(event) => setPickedLocationId(event.target.value)}
            className="h-8 rounded-md border border-line bg-canvas px-2 text-ink outline-none"
          >
            {locations.map((location) => (
              <option key={location.inventoryLocationId} value={location.inventoryLocationId}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {stockQuery.isError && <ErrorState title={t("inventory.overview.stockError")} message={stockQuery.error?.message} />}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <KpiCard icon={Boxes} label={t("inventory.overview.kpi.tracked")} value={stockQuery.isLoading ? "…" : stats.total} />
        <KpiCard icon={PackageCheck} label={t("inventory.overview.kpi.inStock")} value={stockQuery.isLoading ? "…" : stats.inStock} tone="success" />
        <KpiCard icon={PackageX} label={t("inventory.overview.kpi.outOfStock")} value={stockQuery.isLoading ? "…" : stats.out} tone={stats.out ? "warning" : "ink"} />
        <KpiCard icon={TriangleAlert} label={t("inventory.overview.kpi.negative")} value={stockQuery.isLoading ? "…" : stats.negative} tone={stats.negative ? "danger" : "ink"} />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {OPERATIONS.map((operation) => (
          <OperationCard
            key={operation.type}
            companyId={companyId}
            branchId={branchId}
            canView={canView}
            operation={operation}
            sinceUtc={sinceUtc}
            onOpen={onOpenLedger}
          />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title={t("inventory.overview.needsAttention")}>
          {stats.attention.length ? (
            <ul>{stats.attention.map((item) => itemRow(item, quantity(item) < 0 ? "text-danger" : "text-warning"))}</ul>
          ) : (
            <p className="py-6 text-center text-sm text-subtle">{t("inventory.overview.allGood")}</p>
          )}
        </Panel>
        <Panel title={t("inventory.overview.lowest")}>
          {stats.lowest.length ? (
            <ul>{stats.lowest.map((item) => itemRow(item, "text-ink"))}</ul>
          ) : (
            <p className="py-6 text-center text-sm text-subtle">{t("inventory.overview.noStock")}</p>
          )}
        </Panel>
      </div>

      <Panel title={t("inventory.overview.recent")}>
        {recentQuery.isLoading ? (
          <LoadingState label={t("inventory.overview.loading")} />
        ) : (
          <ListView
            columns={[
              { key: "date", header: t("inventory.overview.col.date"), render: (row) => <span className="text-muted">{formatDateTime(row.createdAtUtc)}</span> },
              {
                key: "type",
                header: t("inventory.overview.col.type"),
                render: (row) => <StatusPill tone={TYPE_TONE[row.transactionType] ?? "neutral"}>{t(`inventory.type.${row.transactionType}`)}</StatusPill>,
              },
              { key: "location", header: t("inventory.overview.location"), render: (row) => row.inventoryLocationName },
              { key: "lines", header: t("inventory.overview.col.lines"), align: "end", render: (row) => row.lineCount },
              { key: "reason", header: t("inventory.overview.col.reason"), render: (row) => <span className="text-muted">{row.reason || "—"}</span> },
            ]}
            rows={recentQuery.data?.items ?? []}
            getRowKey={(row) => row.inventoryStockTransactionId}
            onRowClick={(row) => onOpenLedger(row.transactionType)}
            emptyLabel={t("inventory.overview.noMovements")}
          />
        )}
      </Panel>
    </div>
  );
}
