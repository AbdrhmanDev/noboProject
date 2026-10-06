import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { useI18n } from "../../../../i18n/I18nContext";
import { formatMoney } from "../../../../shared/utils/formatters";

// Soft, distinct fills (Odoo's treemap look); dark ink on all of them for legibility.
const FILLS = ["#bfdbfe", "#a5c8f5", "#b4e7dc", "#9edfcf", "#f8c4d2", "#fde4a8", "#d0d5db", "#c7e9b4"];
const INK = "#0e0f13";

function Tile({ x, y, width, height, index, name, value, currencyCode }) {
  if (width <= 0 || height <= 0) return null;
  const showText = width > 70 && height > 36;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={FILLS[index % FILLS.length]} style={{ stroke: "var(--nobo-surface)", strokeWidth: 2 }} />
      {showText && (
        <>
          <text x={x + 6} y={y + height - 22} fill={INK} fontSize={12} fontWeight={600}>
            {name.length > Math.floor(width / 7) ? `${name.slice(0, Math.floor(width / 7) - 1)}…` : name}
          </text>
          <text x={x + 6} y={y + height - 7} fill={INK} fontSize={11}>
            {currencyCode ? formatMoney(value, currencyCode, 2) : value.toFixed(2)}
          </text>
        </>
      )}
    </g>
  );
}

function TileTooltip({ active, payload, currencyCode }) {
  if (!active || !payload?.length) return null;
  const tile = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-[11px] shadow-xl">
      <div className="font-bold text-ink">{tile.name}</div>
      <div className="pos-num text-muted">{currencyCode ? formatMoney(tile.value, currencyCode, 2) : tile.value}</div>
    </div>
  );
}

// Sales by product category as a treemap: each tile's area is the category's share of line
// revenue. Categories with no revenue are left out (a zero-area tile can't be drawn).
export function SalesCategoryTreemap({ rows, currencyCode }) {
  const { t } = useI18n();
  const data = rows.filter((row) => row.amount > 0).map((row) => ({ name: row.label, value: row.amount }));

  if (!data.length) {
    return <p className="py-6 text-center text-xs text-subtle">{t("salesOrders.overview.rankings.empty")}</p>;
  }

  return (
    <div className="h-80 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="value"
          nameKey="name"
          isAnimationActive={false}
          content={<Tile currencyCode={currencyCode} />}
        >
          <Tooltip content={<TileTooltip currencyCode={currencyCode} />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
