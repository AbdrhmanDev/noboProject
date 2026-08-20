import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import { RestaurantModal } from "./RestaurantModal";
import { useCreateTableAttention } from "../hooks/useFloorState";
import { ATTENTION_TYPE_LABEL_KEYS } from "../utils/floorOperationalState";

const ATTENTION_TYPES = ["GuestIssue", "ServiceIssue", "Complaint", "SpecialRequest", "Other"];
const NOTE_MAX_LENGTH = 500;

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

export function FlagAttentionDialog({ companyId, branchId, table, session, onClose, onSuccess }) {
  const { t } = useI18n();
  const [type, setType] = useState(ATTENTION_TYPES[0]);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");

  const createAttentionMutation = useCreateTableAttention(companyId, branchId);

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!note.trim()) {
      setFormError(t("restaurantFloor.attention.noteRequired"));
      return;
    }

    try {
      await createAttentionMutation.mutateAsync({
        sessionId: session.restaurantTableSessionId,
        payload: { type, note: note.trim() },
      });
      toast.success(t("restaurantFloor.toast.attentionCreated", { code: table.code }));
      onSuccess();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <RestaurantModal title={t("restaurantFloor.actions.flagAttention")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {formError && (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {formError}
          </div>
        )}

        <label className="block text-xs font-semibold text-slate-400">
          {t("restaurantFloor.attention.type")}
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
          >
            {ATTENTION_TYPES.map((value) => (
              <option key={value} value={value}>
                {t(ATTENTION_TYPE_LABEL_KEYS[value])}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold text-slate-400">
          {t("restaurantFloor.form.note")}
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={NOTE_MAX_LENGTH}
            className="mt-1 h-24 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white outline-none focus:border-rose-400/60"
          />
          <span className="mt-1 block text-[10px] font-normal text-slate-500">
            {note.length}/{NOTE_MAX_LENGTH}
          </span>
        </label>

        <button
          type="submit"
          disabled={createAttentionMutation.isPending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createAttentionMutation.isPending
            ? t("restaurantFloor.actions.saving")
            : t("restaurantFloor.actions.flagAttention")}
        </button>
      </form>
    </RestaurantModal>
  );
}
