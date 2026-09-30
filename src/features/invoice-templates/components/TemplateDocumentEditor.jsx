import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { TemplateBlockEditor } from "./TemplateBlockEditor";
import { buildDefaultBlockInstance } from "../utils/templateDocumentDefaults";

// The whole document editor: settings (paper width / locale) + the ordered list of blocks. Fully
// self-contained (its own state, seeded once from `initialDocument`) so the parent never has to
// reconcile an external document object back into this component's internal per-row keys -- it just
// reads the latest built TemplateDocument from `onChange`, called on every edit.
//
// `schema` is the backend's own catalog (GET .../invoice-templates/schema): the "add block" menu, each
// block's editable properties and the items-table's mandatory columns all come from it, in ITS OWN
// declared order -- nothing here re-sorts or invents an entry the schema does not list.
export function TemplateDocumentEditor({ schema, initialDocument, onChange, disabled }) {
  const [paperWidth, setPaperWidth] = useState(initialDocument.settings.paperWidth);
  const [locale, setLocale] = useState(initialDocument.settings.locale);
  const [keyedBlocks, setKeyedBlocks] = useState(() =>
    initialDocument.blocks.map((block, index) => ({ clientKey: index, block })),
  );
  // Only ever read/written inside event handlers below (addBlock), never during render or a state
  // initializer -- refs must not be accessed while rendering.
  const nextKeyRef = useRef(initialDocument.blocks.length);
  const [addBlockType, setAddBlockType] = useState("");

  const emit = (nextPaperWidth, nextLocale, nextKeyedBlocks) => {
    onChange({
      schemaVersion: schema.currentSchemaVersion,
      settings: { paperWidth: nextPaperWidth, locale: nextLocale },
      blocks: nextKeyedBlocks.map((entry) => entry.block),
    });
  };

  const blockTypeByName = new Map(schema.blockTypes.map((entry) => [entry.type, entry]));
  const placedSystemTypes = new Set(
    keyedBlocks.map((entry) => entry.block.type).filter((type) => blockTypeByName.get(type)?.control === "System"),
  );
  // A system block may appear at most once (schema's own maxOccurrences); a merchant block has none.
  const addableTypes = schema.blockTypes.filter(
    (entry) => entry.control === "Merchant" || !placedSystemTypes.has(entry.type),
  );

  const changePaperWidth = (value) => {
    setPaperWidth(value);
    emit(value, locale, keyedBlocks);
  };

  const changeLocale = (value) => {
    setLocale(value);
    emit(paperWidth, value, keyedBlocks);
  };

  const updateBlock = (clientKey, nextBlock) => {
    const next = keyedBlocks.map((entry) => (entry.clientKey === clientKey ? { ...entry, block: nextBlock } : entry));
    setKeyedBlocks(next);
    emit(paperWidth, locale, next);
  };

  const removeBlock = (clientKey) => {
    const next = keyedBlocks.filter((entry) => entry.clientKey !== clientKey);
    setKeyedBlocks(next);
    emit(paperWidth, locale, next);
  };

  const moveBlock = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= keyedBlocks.length) return;
    const next = [...keyedBlocks];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setKeyedBlocks(next);
    emit(paperWidth, locale, next);
  };

  const addBlock = () => {
    const schemaBlockType = blockTypeByName.get(addBlockType);
    if (!schemaBlockType || keyedBlocks.length >= schema.maxBlocks) return;
    const next = [...keyedBlocks, { clientKey: nextKeyRef.current++, block: buildDefaultBlockInstance(schema, schemaBlockType) }];
    setKeyedBlocks(next);
    emit(paperWidth, locale, next);
    setAddBlockType("");
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-400">
          Paper width
          <select
            value={paperWidth}
            onChange={(event) => changePaperWidth(event.target.value)}
            disabled={disabled}
            className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          >
            {schema.paperWidths.map((width) => (
              <option key={width} value={width}>
                {width}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-400">
          Locale
          <span className="ms-1 font-normal text-slate-500">(e.g. ar-SA)</span>
          <input
            type="text"
            value={locale}
            onChange={(event) => changeLocale(event.target.value)}
            disabled={disabled}
            maxLength={35}
            className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
      </div>

      <div className="space-y-2">
        {keyedBlocks.map((entry, index) => (
          <TemplateBlockEditor
            key={entry.clientKey}
            block={entry.block}
            schemaBlockType={blockTypeByName.get(entry.block.type)}
            requiredItemsTableColumns={schema.requiredItemsTableColumns}
            onChange={(nextBlock) => updateBlock(entry.clientKey, nextBlock)}
            onRemove={() => removeBlock(entry.clientKey)}
            onMoveUp={() => moveBlock(index, -1)}
            onMoveDown={() => moveBlock(index, 1)}
            canMoveUp={index > 0}
            canMoveDown={index < keyedBlocks.length - 1}
            disabled={disabled}
          />
        ))}
        {keyedBlocks.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-xs text-slate-500">
            No blocks yet. Add one below.
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2">
        <select
          value={addBlockType}
          onChange={(event) => setAddBlockType(event.target.value)}
          disabled={disabled || keyedBlocks.length >= schema.maxBlocks}
          className="h-9 flex-1 rounded-lg border border-white/10 bg-black/20 px-2 text-xs text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
        >
          <option value="">Add a block...</option>
          {addableTypes.map((entry) => (
            <option key={entry.type} value={entry.type}>
              {entry.type} ({entry.control})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addBlock}
          disabled={disabled || !addBlockType || keyedBlocks.length >= schema.maxBlocks}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} />
          Add
        </button>
      </div>
      <p className="text-[11px] text-slate-500">
        {keyedBlocks.length} / {schema.maxBlocks} blocks
      </p>
    </div>
  );
}
