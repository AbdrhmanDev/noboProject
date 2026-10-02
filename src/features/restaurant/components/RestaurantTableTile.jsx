import { useI18n } from "../../../i18n/I18nContext";
import {
  OPERATIONAL_STATE_LABEL_KEYS,
  TABLE_TONE_CHAIR_CLASSES,
  TABLE_TONE_CLASSES,
  TABLE_TONE_LABEL_KEYS,
  TABLE_TONE_TEXT_CLASSES,
  getTableTone,
} from "../utils/floorOperationalState";

// Chairs drawn around every table -- purely decorative, always the same count so every table on
// the floor looks identical apart from its number and colour.
const TOP_CHAIRS = 2;
const BOTTOM_CHAIRS = 2;

// Floor-plan style tile (Odoo-like): a table with chairs above and below it, showing ONLY its
// number (its configured code, e.g. "T-1"). Everything else is carried by its colour alone
// (getTableTone): no colour = no open order, yellow = an order taken but not sent to the kitchen
// yet, green = its order is on the kitchen screen. State, guests, reservation, totals etc. live
// in RestaurantTableDetailsDrawer, one tap away. The state is still in the accessible name.
export function RestaurantTableTile({ table, canManage, selected, onSelect }) {
  const { t } = useI18n();
  const state = table.operationalState;
  const tone = getTableTone(table);
  const chairClass = TABLE_TONE_CHAIR_CLASSES[tone];

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={state === "UNAVAILABLE" && !canManage}
      aria-pressed={selected}
      aria-label={`${table.code} · ${t(TABLE_TONE_LABEL_KEYS[tone])} · ${t(OPERATIONAL_STATE_LABEL_KEYS[state])}`}
      title={table.name || undefined}
      className={`group flex w-full flex-col items-stretch gap-1.5 rounded-2xl p-2 text-start transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
        state === "UNAVAILABLE" ? "opacity-50" : ""
      } ${selected ? "bg-white/[0.06] ring-2 ring-blue-400/70" : "hover:bg-white/[0.03]"}`}
    >
      <ChairRow count={TOP_CHAIRS} className={chairClass} />

      <div
        className={`flex h-[var(--floor-table-h)] items-center justify-center overflow-hidden rounded-xl border-2 px-2 transition ${
          TABLE_TONE_CLASSES[tone]
        }`}
      >
        <span className={`pos-num truncate text-[length:var(--floor-table-fs)] font-black leading-none ${TABLE_TONE_TEXT_CLASSES[tone]}`}>
          {table.code}
        </span>
      </div>

      <ChairRow count={BOTTOM_CHAIRS} className={chairClass} />
    </button>
  );
}

function ChairRow({ count, className }) {
  return (
    <div className="flex h-2.5 justify-evenly px-4" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className={`h-2.5 w-[24%] max-w-12 rounded-full ${className}`} />
      ))}
    </div>
  );
}
