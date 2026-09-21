import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, ChevronLeft, ChevronRight, RefreshCw, Settings } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import {
  useAllOpenKitchenTickets,
  useKitchenTicketActions,
  useOperationalKitchenStations,
} from "../../features/kitchen/hooks/useKitchen";
import { KitchenTicketCard } from "../../features/kitchen/components/KitchenTicketCard";
import { ROUTES } from "../../utils/routes";

const KITCHEN_VIEW_PERMISSION = "Kitchen.View";
const KITCHEN_MANAGE_PERMISSION = "Kitchen.Manage";

// Card footprint used to work out how many orders fit on one screen.
const CARD_MIN_WIDTH = 300;
const CARD_HEIGHT = 420;
const GRID_GAP = 16;
// Room kept under the board for the pager and the page's bottom padding.
const BOARD_BOTTOM_RESERVE = 96;

// How many card columns / rows fit in the board's box, so one page is exactly one screen.
function useBoardCapacity(dependency) {
  const boardRef = useRef(null);
  const [capacity, setCapacity] = useState({ cols: 3, rows: 1 });

  useEffect(() => {
    const measure = () => {
      const board = boardRef.current;
      if (!board) return;

      const height = window.innerHeight - board.getBoundingClientRect().top - BOARD_BOTTOM_RESERVE;
      const cols = Math.max(1, Math.floor((board.clientWidth + GRID_GAP) / (CARD_MIN_WIDTH + GRID_GAP)));
      const rows = Math.max(1, Math.floor((height + GRID_GAP) / (CARD_HEIGHT + GRID_GAP)));
      setCapacity((current) => (current.cols === cols && current.rows === rows ? current : { cols, rows }));
    };

    measure();
    window.addEventListener("resize", measure);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (observer && boardRef.current) observer.observe(boardRef.current);

    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [dependency]);

  return [boardRef, capacity];
}

function SectionTab({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-11 shrink-0 items-center gap-2 rounded-full border px-5 text-sm font-bold transition ${
        active
          ? "border-accent bg-accent text-white shadow-[var(--shadow-surface)]"
          : "border-line bg-surface text-muted hover:border-line-strong hover:bg-hover hover:text-ink"
      }`}
    >
      {label}
      <span
        className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-black ${
          active ? "bg-white/25 text-white" : "bg-inset text-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function Pager({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, index) => index);
  const btn =
    "grid h-10 min-w-10 place-items-center rounded-xl border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Kitchen pages">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        aria-label="الصفحة السابقة"
        className={`${btn} border-line bg-surface text-muted hover:border-accent-line hover:text-ink`}
      >
        <ChevronRight size={18} />
      </button>
      {pages.map((index) => (
        <button
          key={index}
          type="button"
          onClick={() => onChange(index)}
          aria-current={index === page ? "page" : undefined}
          className={`${btn} ${
            index === page
              ? "border-accent bg-accent text-white"
              : "border-line bg-surface text-muted hover:border-accent-line hover:text-ink"
          }`}
        >
          {index + 1}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount - 1}
        aria-label="الصفحة التالية"
        className={`${btn} border-line bg-surface text-muted hover:border-accent-line hover:text-ink`}
      >
        <ChevronLeft size={18} />
      </button>
    </nav>
  );
}

export default function KitchenPage() {
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [page, setPage] = useState(0);
  // "all", or the id of one section (= kitchen station) whose products this tab shows.
  const [sectionId, setSectionId] = useState("all");
  const [toast, setToast] = useState("");
  // The API only returns open tickets, so an order marked ready would vanish at once. Keep it on
  // the board (as a snapshot) until the cook removes it with the trash button.
  const [readyTickets, setReadyTickets] = useState({});
  const viewPermissionQuery = useHasPermission(currentCompanyId, KITCHEN_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, KITCHEN_MANAGE_PERMISSION);
  const canLoadKitchen =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    !viewPermissionQuery.isError &&
    viewPermissionQuery.hasPermission;
  const stationsQuery = useOperationalKitchenStations(currentCompanyId, currentBranchId, canLoadKitchen);
  const stations = useMemo(() => stationsQuery.data || [], [stationsQuery.data]);

  // Every active station's open tickets, merged into one queue (oldest first).
  const board = useAllOpenKitchenTickets(currentCompanyId, currentBranchId, stations, canLoadKitchen);
  const allTickets = useMemo(() => {
    const openIds = new Set(board.tickets.map((ticket) => ticket.kitchenTicketId));
    const kept = Object.values(readyTickets).filter((ticket) => !openIds.has(ticket.kitchenTicketId));
    return [...board.tickets, ...kept].sort(
      (a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime(),
    );
  }, [board.tickets, readyTickets]);
  const activeSectionId =
    sectionId === "all" || stations.some((station) => station.kitchenStationId === sectionId)
      ? sectionId
      : "all";
  const tickets = useMemo(
    () =>
      activeSectionId === "all"
        ? allTickets
        : allTickets.filter((ticket) => ticket.kitchenStationId === activeSectionId),
    [activeSectionId, allTickets],
  );
  const sectionCounts = useMemo(() => {
    const counts = {};
    for (const ticket of allTickets) {
      counts[ticket.kitchenStationId] = (counts[ticket.kitchenStationId] || 0) + 1;
    }
    return counts;
  }, [allTickets]);
  const selectSection = (id) => {
    setSectionId(id);
    setPage(0);
  };
  const { start: startMutation, ready: readyMutation } = useKitchenTicketActions(
    currentCompanyId,
    currentBranchId,
  );
  const isMutating = startMutation.isPending || readyMutation.isPending;
  const canManage = !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;
  const newCount = allTickets.filter((ticket) => ticket.status === "New").length;
  const preparingCount = allTickets.filter((ticket) => ticket.status === "Preparing").length;
  const readyCount = allTickets.filter((ticket) => ticket.status === "Ready").length;

  const [boardRef, { cols, rows }] = useBoardCapacity(tickets.length);
  const pageSize = cols * rows;
  const pageCount = Math.max(1, Math.ceil(tickets.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleTickets = tickets.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };
  const handleLifecycleError = (error) => {
    if (
      error?.code === "KitchenTicket.InvalidStatusTransition" ||
      error?.code === "KitchenTicket.NotAvailable"
    ) {
      board.refetch();
    }

    notify(error?.message || "تعذر تحديث تذكرة المطبخ");
  };
  const startTicket = async (ticket) => {
    try {
      await startMutation.mutateAsync({
        kitchenStationId: ticket.kitchenStationId,
        kitchenTicketId: ticket.kitchenTicketId,
      });
      notify("تم بدء التحضير");
    } catch (error) {
      handleLifecycleError(error);
    }
  };
  const markReady = async (ticket) => {
    try {
      await readyMutation.mutateAsync({
        kitchenStationId: ticket.kitchenStationId,
        kitchenTicketId: ticket.kitchenTicketId,
      });
      setReadyTickets((current) => ({
        ...current,
        [ticket.kitchenTicketId]: { ...ticket, status: "Ready" },
      }));
      notify("تم تعليم التذكرة كجاهزة");
    } catch (error) {
      handleLifecycleError(error);
    }
  };

  const dismissTicket = (ticket) => {
    setReadyTickets((current) => {
      const next = { ...current };
      delete next[ticket.kitchenTicketId];
      return next;
    });
  };

  const allFailed = board.stationCount > 0 && board.failedCount === board.stationCount;

  return (
    <AppLayout activePath={ROUTES.KITCHEN}>
      <main className="min-w-0 flex-1 p-3 sm:p-4 xl:p-5" dir="rtl">
        <div className="mx-auto max-w-[2200px] space-y-4">
          <header className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-accent">
                <ChefHat size={17} />
                KDS
              </div>
              <h1 className="mt-1 text-2xl font-black text-ink">شاشة تشغيل المطبخ</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-xs font-bold text-accent">
                جديدة
                <span className="text-base font-black">{newCount}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning-soft px-3 py-2 text-xs font-bold text-warning">
                قيد التحضير
                <span className="text-base font-black">{preparingCount}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-success/40 bg-success-soft px-3 py-2 text-xs font-bold text-success">
                جاهزة
                <span className="text-base font-black">{readyCount}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate(ROUTES.KITCHEN_ADMIN)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-inset px-3 text-xs font-bold text-ink transition hover:border-accent-line hover:bg-accent-soft"
              >
                <Settings size={15} />
                Configuration
              </button>
              <button
                type="button"
                onClick={() => board.refetch()}
                disabled={!stations.length || board.isFetching}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-inset px-3 text-xs font-bold text-ink transition hover:border-accent-line hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={15} className={board.isFetching ? "animate-spin" : ""} />
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
            <EmptyState title="لا توجد صلاحية للمطبخ" message="تحتاج Kitchen.View لعرض تذاكر المطبخ." />
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
              {board.failedCount > 0 && !allFailed && (
                <p className="rounded-xl border border-warning/40 bg-warning-soft px-3 py-2 text-xs font-semibold text-warning">
                  تعذر تحميل تذاكر بعض المحطات، الأوردرات المعروضة قد تكون ناقصة.
                </p>
              )}

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <SectionTab
                  label="الكل"
                  count={allTickets.length}
                  active={activeSectionId === "all"}
                  onClick={() => selectSection("all")}
                />
                {stations.map((station) => (
                  <SectionTab
                    key={station.kitchenStationId}
                    label={station.name}
                    count={sectionCounts[station.kitchenStationId] || 0}
                    active={activeSectionId === station.kitchenStationId}
                    onClick={() => selectSection(station.kitchenStationId)}
                  />
                ))}
              </div>

              <div ref={boardRef}>
                {board.isLoading ? (
                  <LoadingState label="Loading kitchen tickets..." />
                ) : allFailed ? (
                  <ErrorState
                    title="Kitchen tickets unavailable"
                    message="Unable to load open tickets for the kitchen."
                  />
                ) : !tickets.length ? (
                  <EmptyState
                    title="لا توجد تذاكر مفتوحة"
                    message={
                      activeSectionId === "all"
                        ? "ستظهر الطلبات المؤكدة هنا عندما ينشئ Confirm تذاكر للمطبخ."
                        : "لا توجد أوردرات مفتوحة في هذا القسم."
                    }
                  />
                ) : (
                  <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                  >
                    {visibleTickets.map((ticket) => (
                      <KitchenTicketCard
                        key={ticket.kitchenTicketId}
                        ticket={ticket}
                        canManage={canManage}
                        isMutating={isMutating}
                        onStart={startTicket}
                        onReady={markReady}
                        onDismiss={dismissTicket}
                      />
                    ))}
                  </div>
                )}
              </div>

              <Pager page={currentPage} pageCount={pageCount} onChange={setPage} />
            </>
          )}
        </div>

        {toast && (
          <div className="fixed bottom-5 left-1/2 z-[110] -translate-x-1/2 rounded-xl border border-accent-line bg-surface px-4 py-3 text-xs font-bold text-ink shadow-xl">
            {toast}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
