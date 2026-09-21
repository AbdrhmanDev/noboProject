import { useState } from "react";
import { Printer } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { useSalesOverview } from "../../../sales/hooks/useSalesOrders";
import { formatPaymentDate } from "../../utils/posFormatters";
import { PosModal } from "../PosModal";

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function buildPrintHtml({ title, meta, cashRows, methodRows, totalCash, orderCount }) {
  const rows = (items) =>
    items.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td class="n">${escapeHtml(value)}</td></tr>`).join("");
  const methods = methodRows
    .map((row) => `<tr><td>${escapeHtml(row.name)}</td><td class="n">${escapeHtml(row.gross)}</td><td class="n">${escapeHtml(row.refunded)}</td><td class="n"><b>${escapeHtml(row.net)}</b></td></tr>`)
    .join("");

  return `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body{font-family:Tahoma,Arial,sans-serif;padding:20px;color:#111;font-size:13px}
  h1{font-size:18px;margin:0 0 4px} h2{font-size:14px;margin:18px 0 6px}
  table{width:100%;border-collapse:collapse} td,th{padding:5px 6px;border-bottom:1px solid #ddd;text-align:start}
  td.n,th.n{text-align:end;white-space:nowrap} .meta{color:#555;margin-bottom:10px}
  .big{display:flex;gap:24px;margin:12px 0} .big div{border:1px solid #999;padding:8px 14px}
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">${meta.map((line) => escapeHtml(line)).join("<br>")}</div>
<div class="big"><div>إجمالي النقدية<br><b>${escapeHtml(totalCash)}</b></div><div>عدد الأوردرات<br><b>${escapeHtml(orderCount)}</b></div></div>
<h2>النقدية</h2><table>${rows(cashRows)}</table>
<h2>طرق الدفع</h2><table><tr><th>الطريقة</th><th class="n">المدفوع</th><th class="n">المسترد</th><th class="n">الصافي</th></tr>${methods}</table>
</body></html>`;
}

function printHtml(html) {
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);
  frame.onload = () => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    window.setTimeout(() => frame.remove(), 1000);
  };
  frame.srcdoc = html;
}

function Row({ label, value, strong = false }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-1.5 text-xs ${strong ? "font-black text-ink" : "text-muted"}`}>
      <span>{label}</span>
      <span className={strong ? "text-sm" : "font-semibold text-ink"}>{value}</span>
    </div>
  );
}

/**
 * End-of-shift ("Z") report for the currently open shift: everything that happened on the shift so
 * far, with the cash total and the number of orders. It only reads — closing the shift and
 * starting the next one still go through the normal close/open flow.
 */
export function ShiftReportDialog({ shift, companyId, branchId, cashierName, onClose }) {
  // Freeze "now" so the overview query key doesn't change on every render.
  const [toUtc] = useState(() => new Date().toISOString());
  const overviewQuery = useSalesOverview(companyId, branchId, { fromUtc: shift.openedAtUtc, toUtc });

  const money = (amount) => formatMoney(amount ?? 0, shift.currencyCode, shift.currencyMinorUnitDigits);
  const orderCount = overviewQuery.isLoading ? "…" : overviewQuery.isError ? "—" : String(overviewQuery.data?.orderCount ?? 0);

  const cashRows = [
    ["رصيد الفتح", money(shift.openingFloatAmount)],
    ["مبيعات نقدية", money(shift.cashPaymentsAmount)],
    ["مرتجعات نقدية", `- ${money(shift.cashRefundsAmount)}`],
    ["إيداع نقدي (Cash In)", money(shift.cashInAmount)],
    ["سحب نقدي (Cash Out)", `- ${money(shift.cashOutAmount)}`],
  ];
  const methodRows = (shift.paymentMethods || []).map((method) => ({
    name: method.name,
    gross: money(method.grossPaidAmount),
    refunded: money(method.refundedAmount),
    net: money(method.netPaidAmount),
  }));
  const title = "Z Report — تقرير الشيفت";
  const meta = [
    `${shift.terminalName} · ${shift.terminalCode}`,
    `الكاشير: ${cashierName || "-"}`,
    `فتح الشيفت: ${formatPaymentDate(shift.openedAtUtc)}`,
    `وقت التقرير: ${formatPaymentDate(toUtc)}`,
  ];

  const handlePrint = () => {
    printHtml(
      buildPrintHtml({ title, meta, cashRows, methodRows, totalCash: money(shift.expectedCashAmount), orderCount }),
    );
  };

  return (
    <PosModal title={title} onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="text-[11px] leading-5 text-subtle">
          {meta.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-line bg-raised p-3">
            <div className="text-[11px] text-muted">إجمالي النقدية في الدرج</div>
            <div className="mt-1 text-xl font-black text-accent">{money(shift.expectedCashAmount)}</div>
          </div>
          <div className="rounded-xl border border-line bg-raised p-3">
            <div className="text-[11px] text-muted">عدد الأوردرات</div>
            <div className="mt-1 text-xl font-black text-ink">{orderCount}</div>
            <div className="mt-0.5 text-[10px] text-subtle">منذ فتح الشيفت</div>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface px-3 py-1">
          {cashRows.map(([label, value]) => (
            <Row key={label} label={label} value={value} />
          ))}
          <div className="border-t border-line">
            <Row label="النقدية المتوقعة" value={money(shift.expectedCashAmount)} strong />
          </div>
        </div>

        {methodRows.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-xs">
              <thead className="bg-inset text-subtle">
                <tr>
                  <th className="px-3 py-2 text-start font-semibold">طريقة الدفع</th>
                  <th className="px-3 py-2 text-end font-semibold">المدفوع</th>
                  <th className="px-3 py-2 text-end font-semibold">المسترد</th>
                  <th className="px-3 py-2 text-end font-semibold">الصافي</th>
                </tr>
              </thead>
              <tbody>
                {methodRows.map((row) => (
                  <tr key={row.name} className="border-t border-line text-ink">
                    <td className="px-3 py-2 font-semibold">{row.name}</td>
                    <td className="px-3 py-2 text-end">{row.gross}</td>
                    <td className="px-3 py-2 text-end">{row.refunded}</td>
                    <td className="px-3 py-2 text-end font-bold">{row.net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-line bg-inset text-xs font-bold text-muted transition hover:bg-hover hover:text-ink"
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-xs font-bold text-white transition hover:bg-accent-strong"
          >
            <Printer size={15} />
            طباعة
          </button>
        </div>
      </div>
    </PosModal>
  );
}
