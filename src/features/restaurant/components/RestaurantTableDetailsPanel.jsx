import { useNavigate } from "react-router-dom";
import { ExternalLink, X } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { StatusBadge } from "../../../shared/components/ui";
import { formatDateTime, formatMoney } from "../../../shared/utils/formatters";
import { useDraftSalesOrderDetails } from "../../sales-orders/hooks/useDraftSalesOrder";
import {
  OPERATIONAL_STATE_LABEL_KEYS,
  OPERATIONAL_STATE_TONE,
} from "../utils/restaurantFloorState";
import { ROUTES } from "../../../utils/routes";

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-2.5">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="mt-0.5 text-xs font-bold text-slate-100">{value ?? "—"}</div>
    </div>
  );
}

function OrderCard({ order, companyId, branchId, canViewOrders }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  // Allowed by design: details are fetched for the ONE order shown in this
  // panel (never for every table on the floor) to surface a real line count
  // instead of guessing or omitting it silently.
  const detailsQuery = useDraftSalesOrderDetails(
    companyId,
    branchId,
    order.salesOrderId,
    canViewOrders,
  );
  const lineCount = detailsQuery.data?.lines?.length;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1728] p-3">
      <div className="flex items-center justify-between gap-2">
        <StatusBadge tone={order.status === "Confirmed" ? "success" : "info"}>
          {order.status}
        </StatusBadge>
        <span className="text-[10px] text-slate-500">{formatDateTime(order.updatedAtUtc)}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label={t("restaurantFloor.details.total")} value={formatMoney(order.payableAmount, order.currencyCode, 2)} />
        <Field label={t("restaurantFloor.details.remaining")} value={formatMoney(order.remainingAmount, order.currencyCode, 2)} />
        <Field
          label={t("restaurantFloor.details.itemCount")}
          value={lineCount !== undefined ? lineCount : detailsQuery.isLoading ? "…" : "—"}
        />
        <Field label={t("restaurantFloor.details.created")} value={formatDateTime(order.createdAtUtc)} />
      </div>
      <button
        type="button"
        onClick={() => navigate(ROUTES.POS)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 py-2 text-xs font-bold text-blue-200 transition hover:bg-blue-500/20"
      >
        <ExternalLink size={13} />
        {t("restaurantFloor.details.openInPos")}
      </button>
      <p className="mt-1.5 text-[10px] leading-4 text-slate-500">
        {t("restaurantFloor.details.openInPosHint")}
      </p>
    </div>
  );
}

export function RestaurantTableDetailsPanel({ table, state, companyId, branchId, canViewOrders, onClose }) {
  const { t } = useI18n();
  if (!table) return null;

  return (
    <aside className="w-full shrink-0 rounded-2xl border border-white/10 bg-[#0c1424] p-4 xl:w-[360px]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] text-slate-500">{table.floorName}</div>
          <h2 className="text-xl font-black text-white">{table.code}</h2>
          {table.name && <div className="text-xs text-slate-400">{table.name}</div>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label={t("restaurantFloor.details.close")}
        >
          <X size={18} />
        </button>
      </div>

      <StatusBadge tone={OPERATIONAL_STATE_TONE[state]}>{t(OPERATIONAL_STATE_LABEL_KEYS[state])}</StatusBadge>

      {!canViewOrders ? (
        <p className="mt-4 text-xs text-slate-500">{t("restaurantFloor.details.ordersPermissionRequired")}</p>
      ) : table.orders.length === 0 ? (
        <p className="mt-4 text-xs text-slate-500">{t("restaurantFloor.details.noActiveOrder")}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {table.orders.length > 1 && (
            <p className="text-[11px] text-blue-300">
              {t("restaurantFloor.details.multipleOrders", { count: table.orders.length })}
            </p>
          )}
          {table.orders.map((order) => (
            <OrderCard
              key={order.salesOrderId}
              order={order}
              companyId={companyId}
              branchId={branchId}
              canViewOrders={canViewOrders}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
