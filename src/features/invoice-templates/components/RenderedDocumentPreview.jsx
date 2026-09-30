import { Image, QrCode } from "lucide-react";

// Renders the backend's OWN RenderedDocument tree (see the type's comment for why this contract,
// not InvoiceRenderModel, is what a UI preview consumes). This is presentation of already-decided
// data, not a rendering engine: every line, alignment, direction and table layout below was already
// computed server-side (InvoiceTemplateRenderer) -- nothing here wraps text, resolves an asset,
// generates a QR image or decides column widths on its own.
//
// Two DELIBERATE simplifications, both because adding real support would mean bringing in a whole
// new rendering capability the task's own scope excludes (no QR generation, no image loading):
//   - QrNode / BarcodeNode: shown as their raw text VALUE in a monospace box when "available", never
//     as an actual scannable graphic (that would need a QR/barcode-drawing library this app does not
//     have and this task does not ask for).
//   - ImageNode: shown as a labeled placeholder (NOBO has no asset storage/URL to resolve from an
//     opaque asset id yet -- the backend's own doc comment says the same: "the renderer never
//     resolves or fetches it").

const ALIGNMENT_CLASS = { start: "text-start", center: "text-center", end: "text-end" };
const SIZE_CLASS = { small: "text-[10px]", normal: "text-xs", large: "text-sm" };
const WEIGHT_CLASS = { bold: "font-black", normal: "font-normal" };

function dirProps(direction) {
  return direction === "ltr" ? { dir: "ltr" } : {};
}

function RenderedTextNode({ node }) {
  return (
    <div className={`${ALIGNMENT_CLASS[node.alignment] || ""} ${SIZE_CLASS[node.size] || ""} ${WEIGHT_CLASS[node.weight] || ""}`}>
      {node.lines.map((line, index) => (
        <div key={index} {...dirProps(node.direction)}>
          {line || " "}
        </div>
      ))}
    </div>
  );
}

function RenderedLabeledValueNode({ node }) {
  return (
    <div className={`flex items-baseline justify-between gap-2 text-xs ${ALIGNMENT_CLASS[node.alignment] || ""}`}>
      <span className="text-slate-400">{node.label}</span>
      <span {...dirProps(node.valueDirection)} className="font-semibold text-white">
        {node.valueLines.join(" ")}
      </span>
    </div>
  );
}

function RenderedCellSpan({ cell }) {
  return (
    <span {...dirProps(cell.direction)} className={ALIGNMENT_CLASS[cell.alignment] || ""}>
      {cell.lines.join(" ")}
    </span>
  );
}

function RenderedRowNode({ node }) {
  return (
    <div className={`flex items-baseline justify-between gap-2 ${SIZE_CLASS[node.size] || ""} ${WEIGHT_CLASS[node.weight] || ""}`}>
      <RenderedCellSpan cell={node.label} />
      <RenderedCellSpan cell={node.value} />
    </div>
  );
}

function RenderedTableNode({ node }) {
  if (node.layout === "stacked") {
    return (
      <div className="space-y-2">
        {node.rows.map((row, rowIndex) => (
          <div key={rowIndex} className="rounded-lg border border-white/10 p-2 text-[11px]">
            {row.heading && <div className="mb-1 font-bold text-white">{row.heading.lines.join(" ")}</div>}
            <div className="grid grid-cols-2 gap-1">
              {row.cells.map((cell, cellIndex) => (
                <div key={cellIndex} className={ALIGNMENT_CLASS[cell.alignment] || ""}>
                  <span className="text-slate-500">{node.columns[cellIndex]?.label}: </span>
                  <RenderedCellSpan cell={cell} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <table className="w-full border-collapse text-[11px]">
      <thead>
        <tr className="border-b border-white/10 text-slate-400">
          {node.columns.map((column) => (
            <th key={column.key} className={`py-1 font-semibold ${ALIGNMENT_CLASS[column.alignment] || ""}`}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {node.rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-b border-white/5">
            {row.cells.map((cell, cellIndex) => (
              <td key={cellIndex} className={`py-1 ${ALIGNMENT_CLASS[cell.alignment] || ""}`}>
                <RenderedCellSpan cell={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RenderedImageNode() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 py-3 text-[11px] text-slate-500">
      <Image size={14} /> Image (asset not resolvable in this preview)
    </div>
  );
}

function RenderedQrNode({ node }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-white/15 p-3 text-[11px] text-slate-400">
      <QrCode size={18} />
      {node.state === "available" && node.payload ? (
        <span className="break-all font-mono text-[10px] text-slate-300">{node.payload}</span>
      ) : (
        <span>QR not available</span>
      )}
    </div>
  );
}

function RenderedBarcodeNode({ node }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 p-2 text-center text-[11px] text-slate-400">
      {node.state === "available" && node.value ? (
        <span className="font-mono text-slate-200">{node.value}</span>
      ) : (
        <span>Barcode not available</span>
      )}
    </div>
  );
}

function RenderedDividerNode({ node }) {
  const borderStyle = node.style === "dashed" ? "dashed" : node.style === "dotted" ? "dotted" : "solid";
  return <hr style={{ borderTopStyle: borderStyle, borderTopWidth: node.thickness }} className="border-white/20" />;
}

function RenderedSpacerNode({ node }) {
  return <div style={{ height: Math.max(node.height, 1) * 6 }} />;
}

const NODE_RENDERERS = {
  text: RenderedTextNode,
  labeledValue: RenderedLabeledValueNode,
  row: RenderedRowNode,
  table: RenderedTableNode,
  image: RenderedImageNode,
  qr: RenderedQrNode,
  barcode: RenderedBarcodeNode,
  divider: RenderedDividerNode,
  spacer: RenderedSpacerNode,
};

// `page.columns` is a LAYOUT HINT (characters per line at normal size), not a pixel width -- 8px per
// column is a cosmetic approximation for a preview box only, not the real print metrics.
export function RenderedDocumentPreview({ document }) {
  return (
    <div
      dir={document.direction}
      className="mx-auto space-y-1.5 rounded-xl border border-white/10 bg-white p-3 text-black shadow-inner"
      style={{ maxWidth: document.page.columns * 8 + 32 }}
    >
      {document.nodes.map((node, index) => {
        const Renderer = NODE_RENDERERS[node.kind];
        return Renderer ? <Renderer key={index} node={node} /> : null;
      })}
    </div>
  );
}
