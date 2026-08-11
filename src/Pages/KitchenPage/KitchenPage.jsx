import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChefHat,
  Clock3,
  CookingPot,
  Flame,
  RefreshCw,
  Settings,
  Timer,
  Utensils,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import {
  useMarkKitchenTicketReady,
  useOpenKitchenTickets,
  useOperationalKitchenStations,
  useStartKitchenTicketPreparation,
} from "../../features/kitchen/hooks/useKitchen";
import { ROUTES } from "../../utils/routes";

const KITCHEN_VIEW_PERMISSION = "Kitchen.View";
const KITCHEN_MANAGE_PERMISSION = "Kitchen.Manage";

function formatTicketAge(createdAtUtc) {
  const createdAt = new Date(createdAtUtc).getTime();
  if (!Number.isFinite(createdAt)) return "--";

  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `${minutes} د`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} س ${remainder} د` : `${hours} س`;
}

function formatTicketTime(value) {
  if (!value) return "--";

  return new Intl.DateTimeFormat("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusTone(status) {
  if (status === "Preparing") {
    return "border-amber-400/35 bg-amber-500/15 text-amber-100";
  }

  return "border-blue-400/35 bg-blue-500/15 text-blue-100";
}

function TicketCard({
  ticket,
  canManage,
  isMutating,
  onStart,
  onReady,
}) {
  const tableLabel = ticket.restaurantTable
    ? `${ticket.restaurantTable.name || ticket.restaurantTable.code} · ${ticket.restaurantTable.code}`
    : null;

  return (
    <article className="flex min-h-[360px] flex-col rounded-xl border border-white/10 bg-[#0d1728] p-4 shadow-xl shadow-black/20">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ChefHat size={15} className="text-blue-300" />
            <span>تذكرة مطبخ</span>
            <span className="text-slate-600">#{ticket.kitchenTicketId.slice(-6)}</span>
          </div>
          <h2 className="mt-1 text-lg font-black text-white">
            {ticket.fulfillmentType}
            {tableLabel ? ` · ${tableLabel}` : ""}
          </h2>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusTone(ticket.status)}`}>
          {ticket.status}
        </span>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg bg-white/[0.035] p-2">
          <div className="flex items-center gap-1 text-slate-500">
            <Timer size={13} /> العمر
          </div>
          <div className="mt-1 font-bold text-white">{formatTicketAge(ticket.createdAtUtc)}</div>
        </div>
        <div className="rounded-lg bg-white/[0.035] p-2">
          <div className="flex items-center gap-1 text-slate-500">
            <Clock3 size={13} /> الإنشاء
          </div>
          <div className="mt-1 font-bold text-white">{formatTicketTime(ticket.createdAtUtc)}</div>
        </div>
        <div className="rounded-lg bg-white/[0.035] p-2">
          <div className="flex items-center gap-1 text-slate-500">
            <Flame size={13} /> البدء
          </div>
          <div className="mt-1 font-bold text-white">{formatTicketTime(ticket.startedAtUtc)}</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-none">
        {ticket.items.map((item) => (
          <div
            key={item.kitchenTicketItemId}
            className="rounded-lg border border-white/8 bg-white/[0.025] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-50">
                  {Number(item.quantity)} × {item.productName}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {item.variantName} · {item.salesUnitOfMeasure.symbol || item.salesUnitOfMeasure.code}
                </div>
              </div>
              <Utensils size={17} className="shrink-0 text-slate-500" />
            </div>
            {item.modifiers.length > 0 && (
              <div className="mt-2 space-y-1 border-t border-white/8 pt-2">
                {item.modifiers.map((modifier) => (
                  <div
                    key={`${item.kitchenTicketItemId}-${modifier.modifierGroupName}-${modifier.modifierOptionName}`}
                    className="text-[11px] text-blue-100"
                  >
                    - {modifier.modifierGroupName}: {modifier.modifierOptionName}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {ticket.status === "New" && (
          <button
            type="button"
            disabled={!canManage || isMutating}
            onClick={() => onStart(ticket.kitchenTicketId)}
            className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-lg bg-amber-600 text-xs font-black text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CookingPot size={16} />
            بدء التحضير
          </button>
        )}
        {ticket.status === "Preparing" && (
          <button
            type="button"
            disabled={!canManage || isMutating}
            onClick={() => onReady(ticket.kitchenTicketId)}
            className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-xs font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            جاهز
          </button>
        )}
      </div>
      {!canManage && (
        <p className="mt-2 text-center text-[10px] text-slate-500">
          صلاحية Kitchen.Manage مطلوبة لتغيير حالة التذكرة
        </p>
      )}
    </article>
  );
}

export default function KitchenPage() {
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [toast, setToast] = useState("");
  const viewPermissionQuery = useHasPermission(
    currentCompanyId,
    KITCHEN_VIEW_PERMISSION,
  );
  const managePermissionQuery = useHasPermission(
    currentCompanyId,
    KITCHEN_MANAGE_PERMISSION,
  );
  const canLoadKitchen =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    !viewPermissionQuery.isError &&
    viewPermissionQuery.hasPermission;
  const stationsQuery = useOperationalKitchenStations(
    currentCompanyId,
    currentBranchId,
    canLoadKitchen,
  );
  const stations = useMemo(() => stationsQuery.data || [], [stationsQuery.data]);
  const effectiveStationId = stations.some(
    (station) => station.kitchenStationId === selectedStationId,
  )
    ? selectedStationId
    : stations[0]?.kitchenStationId || null;

  const selectedStation = useMemo(
    () =>
      stations.find((station) => station.kitchenStationId === effectiveStationId) ||
      null,
    [effectiveStationId, stations],
  );
  const ticketsQuery = useOpenKitchenTickets(
    currentCompanyId,
    currentBranchId,
    effectiveStationId,
    canLoadKitchen && Boolean(effectiveStationId),
  );
  const tickets = ticketsQuery.data || [];
  const startMutation = useStartKitchenTicketPreparation(
    currentCompanyId,
    currentBranchId,
    effectiveStationId,
  );
  const readyMutation = useMarkKitchenTicketReady(
    currentCompanyId,
    currentBranchId,
    effectiveStationId,
  );
  const isMutating = startMutation.isPending || readyMutation.isPending;
  const canManage =
    !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;
  const newCount = tickets.filter((ticket) => ticket.status === "New").length;
  const preparingCount = tickets.filter(
    (ticket) => ticket.status === "Preparing",
  ).length;

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };
  const handleLifecycleError = (error) => {
    if (
      error?.code === "KitchenTicket.InvalidStatusTransition" ||
      error?.code === "KitchenTicket.NotAvailable"
    ) {
      ticketsQuery.refetch();
    }

    notify(error?.message || "تعذر تحديث تذكرة المطبخ");
  };
  const startTicket = async (ticketId) => {
    try {
      await startMutation.mutateAsync(ticketId);
      notify("تم بدء التحضير");
    } catch (error) {
      handleLifecycleError(error);
    }
  };
  const markReady = async (ticketId) => {
    try {
      await readyMutation.mutateAsync(ticketId);
      notify("تم تعليم التذكرة كجاهزة");
    } catch (error) {
      handleLifecycleError(error);
    }
  };

  return (
    <AppLayout activePath={ROUTES.KITCHEN}>
      <main className="min-w-0 flex-1 p-3 sm:p-4 xl:p-5" dir="rtl">
        <div className="mx-auto max-w-[1680px] space-y-4">
          <header className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                <ChefHat size={17} />
                KDS
              </div>
              <h1 className="mt-1 text-2xl font-black text-white">
                شاشة تشغيل المطبخ
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                تذاكر مؤكدة من الطلبات الحقيقية حسب محطة المطبخ
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate(ROUTES.KITCHEN_ADMIN)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-slate-200 transition hover:border-blue-400/40"
              >
                <Settings size={15} />
                Configuration
              </button>
              <button
                type="button"
                onClick={() => ticketsQuery.refetch()}
                disabled={!effectiveStationId || ticketsQuery.isFetching}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-slate-200 transition hover:border-blue-400/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={15} className={ticketsQuery.isFetching ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </header>

          {!currentCompanyId || !currentBranchId ? (
            <EmptyState
              title="اختر الشركة والفرع"
              message="شاشة المطبخ تعمل على سياق الفرع ولا تحتاج POS Terminal."
            />
          ) : viewPermissionQuery.isLoading ? (
            <LoadingState label="Checking kitchen access..." />
          ) : viewPermissionQuery.isError || !viewPermissionQuery.hasPermission ? (
            <EmptyState
              title="لا توجد صلاحية للمطبخ"
              message="تحتاج Kitchen.View لعرض تذاكر المطبخ."
            />
          ) : stationsQuery.isLoading ? (
            <LoadingState label="Loading kitchen stations..." />
          ) : stationsQuery.isError ? (
            <ErrorState
              title="Kitchen stations unavailable"
              message="Unable to load operational kitchen stations."
            />
          ) : !stations.length ? (
            <EmptyState
              title="لا توجد محطات مطبخ نشطة"
              message="لم يتم العثور على Kitchen Stations نشطة لهذا الفرع."
            />
          ) : (
            <>
              <section className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="rounded-xl border border-white/10 bg-[#0d1728] p-3">
                  <div className="mb-3 text-xs font-bold text-slate-400">
                    محطات المطبخ
                  </div>
                  <div className="space-y-2">
                    {stations.map((station) => (
                      <button
                        key={station.kitchenStationId}
                        type="button"
                        onClick={() => setSelectedStationId(station.kitchenStationId)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-right transition ${
                          effectiveStationId === station.kitchenStationId
                            ? "border-blue-400/60 bg-blue-500/15 text-blue-50"
                            : "border-white/10 bg-black/10 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <span>
                          <span className="block text-xs font-black">
                            {station.name}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-slate-500">
                            {station.code}
                          </span>
                        </span>
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                          {station.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </aside>

                <section className="min-w-0 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-[#0d1728] p-3">
                      <div className="text-[11px] text-slate-400">المحطة</div>
                      <div className="mt-1 text-lg font-black text-white">
                        {selectedStation?.name || "--"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3">
                      <div className="text-[11px] text-blue-200">جديدة</div>
                      <div className="mt-1 text-lg font-black text-blue-100">
                        {newCount}
                      </div>
                    </div>
                    <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
                      <div className="text-[11px] text-amber-200">قيد التحضير</div>
                      <div className="mt-1 text-lg font-black text-amber-100">
                        {preparingCount}
                      </div>
                    </div>
                  </div>

                  {ticketsQuery.isLoading ? (
                    <LoadingState label="Loading kitchen tickets..." />
                  ) : ticketsQuery.isError ? (
                    <ErrorState
                      title="Kitchen tickets unavailable"
                      message="Unable to load open tickets for this station."
                    />
                  ) : !tickets.length ? (
                    <EmptyState
                      title="لا توجد تذاكر مفتوحة"
                      message="ستظهر الطلبات المؤكدة هنا عندما ينشئ Confirm تذاكر لهذه المحطة."
                    />
                  ) : (
                    <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
                      {tickets.map((ticket) => (
                        <TicketCard
                          key={ticket.kitchenTicketId}
                          ticket={ticket}
                          canManage={canManage}
                          isMutating={isMutating}
                          onStart={startTicket}
                          onReady={markReady}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </section>
            </>
          )}
        </div>

        {toast && (
          <div className="fixed bottom-5 left-1/2 z-[110] -translate-x-1/2 rounded-xl border border-blue-400/25 bg-[#10182a] px-4 py-3 text-xs font-bold text-blue-100 shadow-xl">
            {toast}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
