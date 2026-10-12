import { useEffect, useId, useState } from "react";
import { Star, X } from "lucide-react";
import { useI18n } from "../../../../i18n/I18nContext";
import { OPPORTUNITY_STAGES } from "../types/opportunity.types";

const EMPTY = {
  customerName: "",
  expectedRevenue: "",
  stage: "New",
  priority: 0,
  salespersonName: "",
  tag: "",
  phone: "",
  email: "",
};

const toForm = (opportunity) =>
  opportunity
    ? {
        customerName: opportunity.customerName,
        expectedRevenue: String(opportunity.expectedRevenue ?? ""),
        stage: opportunity.stage,
        priority: opportunity.priority,
        salespersonName: opportunity.salespersonName ?? "",
        tag: opportunity.tag ?? "",
        phone: opportunity.phone ?? "",
        email: opportunity.email ?? "",
      }
    : EMPTY;

const inputClass =
  "h-9 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink outline-none transition focus:border-accent-line";

function Field({ id, label, children, wide }) {
  return (
    <div className={`grid gap-1 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id} className="text-xs font-bold text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

// Add / edit an opportunity. `opportunity` null = new (optionally starting in `initialStage`).
// Returns the draft through onSubmit; persisting it is the caller's (useOpportunityActions).
export function OpportunityFormDialog({ opportunity, initialStage, currencyCode, onSubmit, onClose }) {
  const { t } = useI18n();
  const baseId = useId();
  const [form, setForm] = useState(() => ({ ...toForm(opportunity), ...(opportunity ? {} : { stage: initialStage || "New" }) }));
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const nameMissing = !form.customerName.trim();
  const revenue = Number(form.expectedRevenue);
  const revenueInvalid = form.expectedRevenue !== "" && (!Number.isFinite(revenue) || revenue < 0);

  const submit = (event) => {
    event.preventDefault();
    if (nameMissing || revenueInvalid) {
      setShowErrors(true);
      return;
    }
    onSubmit({
      customerName: form.customerName.trim(),
      expectedRevenue: form.expectedRevenue === "" ? 0 : revenue,
      currencyCode: opportunity?.currencyCode || currencyCode,
      stage: form.stage,
      priority: form.priority,
      salespersonName: form.salespersonName.trim() || null,
      tag: form.tag.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-title`}
        onSubmit={submit}
        noValidate
        className="odoo-root flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-float)]"
        dir="rtl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 id={`${baseId}-title`} className="sales-display text-lg font-black text-ink">
            {opportunity ? opportunity.customerName : t("opportunities.new")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("opportunities.cancel")}
            className="grid h-8 w-8 place-items-center rounded-md text-muted transition hover:bg-hover hover:text-ink"
          >
            <X size={16} />
          </button>
        </header>

        <div className="grid gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2">
          <Field id={`${baseId}-name`} label={t("opportunities.field.customer")} wide>
            <input
              id={`${baseId}-name`}
              value={form.customerName}
              onChange={set("customerName")}
              autoFocus
              aria-invalid={showErrors && nameMissing}
              className={`${inputClass} ${showErrors && nameMissing ? "border-danger" : ""}`}
            />
            {showErrors && nameMissing && <p className="text-xs text-danger">{t("opportunities.customerRequired")}</p>}
          </Field>

          <Field id={`${baseId}-revenue`} label={`${t("opportunities.field.revenue")} (${opportunity?.currencyCode || currencyCode})`}>
            <input
              id={`${baseId}-revenue`}
              type="number"
              inputMode="decimal"
              min="0"
              value={form.expectedRevenue}
              onChange={set("expectedRevenue")}
              aria-invalid={showErrors && revenueInvalid}
              className={`${inputClass} pos-num ${showErrors && revenueInvalid ? "border-danger" : ""}`}
            />
          </Field>

          <Field id={`${baseId}-stage`} label={t("opportunities.field.stage")}>
            <select id={`${baseId}-stage`} value={form.stage} onChange={set("stage")} className={inputClass}>
              {OPPORTUNITY_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {t(`opportunities.stage.${stage}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field id={`${baseId}-salesperson`} label={t("opportunities.field.salesperson")}>
            <input id={`${baseId}-salesperson`} value={form.salespersonName} onChange={set("salespersonName")} className={inputClass} />
          </Field>

          <Field id={`${baseId}-tag`} label={t("opportunities.field.tag")}>
            <input id={`${baseId}-tag`} value={form.tag} onChange={set("tag")} className={inputClass} />
          </Field>

          <Field id={`${baseId}-phone`} label={t("opportunities.field.phone")}>
            <input id={`${baseId}-phone`} type="tel" dir="ltr" value={form.phone} onChange={set("phone")} className={inputClass} />
          </Field>

          <Field id={`${baseId}-email`} label={t("opportunities.field.email")}>
            <input id={`${baseId}-email`} type="email" dir="ltr" value={form.email} onChange={set("email")} className={inputClass} />
          </Field>

          <div className="grid gap-1 sm:col-span-2">
            <span className="text-xs font-bold text-muted">{t("opportunities.field.priority")}</span>
            <div className="flex items-center gap-1" role="radiogroup" aria-label={t("opportunities.field.priority")}>
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  type="button"
                  role="radio"
                  aria-checked={form.priority === step}
                  aria-label={t("opportunities.priorityLabel", { count: step })}
                  onClick={() => setForm((current) => ({ ...current, priority: current.priority === step ? 0 : step }))}
                  className="grid h-8 w-8 place-items-center rounded-md transition hover:bg-hover"
                >
                  <Star size={18} className={step <= form.priority ? "fill-warning text-warning" : "text-line-strong"} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-line bg-raised px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-line px-4 text-sm font-bold text-ink transition hover:bg-hover"
          >
            {t("opportunities.cancel")}
          </button>
          <button
            type="submit"
            className="h-9 rounded-lg bg-accent px-4 text-sm font-bold text-surface transition hover:opacity-90"
          >
            {t("opportunities.save")}
          </button>
        </footer>
      </form>
    </div>
  );
}
