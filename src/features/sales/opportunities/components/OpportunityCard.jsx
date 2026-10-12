import { Mail, Phone, Star, UserRound } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { useI18n } from "../../../../i18n/I18nContext";

// Tag chip tones, picked by a stable hash of the tag text so one tag always has one colour. All from
// the existing theme tokens.
const TAG_TONES = [
  "bg-success-soft text-success",
  "bg-warning-soft text-warning",
  "bg-accent-soft text-accent",
  "bg-danger-soft text-danger",
  "bg-inset text-muted",
];
const toneFor = (text) => TAG_TONES[Array.from(text).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TAG_TONES.length];

export function PriorityStars({ value, size = 13 }) {
  const { t } = useI18n();
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={t("opportunities.priorityLabel", { count: value })}>
      {[1, 2, 3].map((step) => (
        <Star
          key={step}
          size={size}
          className={step <= value ? "fill-warning text-warning" : "text-line-strong"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

// One opportunity in the pipeline: customer, expected revenue, salesperson + priority stars, tag,
// and quick call / email links. The whole card opens the edit form; it can also be dragged onto
// another stage column (`onDragStart`).
export function OpportunityCard({ opportunity, onOpen, onDragStart, onDragEnd, isDragging }) {
  const { t } = useI18n();

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group relative flex flex-col gap-2 rounded-lg border border-line bg-surface p-3 shadow-[var(--shadow-surface)] transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      {/* Stretched button: the whole card opens the form, while the call/email links stay clickable. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={opportunity.customerName}
        className="absolute inset-0 rounded-lg focus-visible:outline-2 focus-visible:outline-accent"
      />
      <div className="flex items-start justify-between gap-2">
        <h3 className="sales-display min-w-0 font-bold leading-snug text-ink">{opportunity.customerName}</h3>
        <PriorityStars value={opportunity.priority} />
      </div>

      <div className="sales-display pos-num text-lg font-black leading-tight text-ink">
        {formatMoney(opportunity.expectedRevenue, opportunity.currencyCode, 0)}
      </div>

      {opportunity.salespersonName && (
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <UserRound size={13} className="shrink-0 text-subtle" />
          <span className="truncate">{opportunity.salespersonName}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-line pt-2">
        {opportunity.tag ? (
          <span className={`truncate rounded-full px-2 py-0.5 text-[11px] font-bold ${toneFor(opportunity.tag)}`}>
            {opportunity.tag}
          </span>
        ) : (
          <span />
        )}
        <div className="relative flex items-center gap-1">
          {opportunity.phone && (
            <a
              href={`tel:${opportunity.phone}`}
              aria-label={t("opportunities.call")}
              title={opportunity.phone}
              className="grid h-7 w-7 place-items-center rounded-md text-subtle transition hover:bg-hover hover:text-ink"
            >
              <Phone size={14} />
            </a>
          )}
          {opportunity.email && (
            <a
              href={`mailto:${opportunity.email}`}
              aria-label={t("opportunities.email")}
              title={opportunity.email}
              className="grid h-7 w-7 place-items-center rounded-md text-subtle transition hover:bg-hover hover:text-ink"
            >
              <Mail size={14} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
