import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import { useCreateEdgeAgent } from "../hooks/useEdgeAgents";
import type { EdgeAgentResponse } from "../types/devices.types";
import { DevicesModal } from "./DevicesModal";

function getErrorMessage(error: unknown) {
  return (error as { message?: string })?.message || "Request failed.";
}

type EdgeAgentFormDialogProps = {
  companyId: string;
  branchId: string;
  onClose: () => void;
  onSuccess: (agent: EdgeAgentResponse) => void;
};

export function EdgeAgentFormDialog({
  companyId,
  branchId,
  onClose,
  onSuccess,
}: EdgeAgentFormDialogProps) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");

  const createMutation = useCreateEdgeAgent(companyId, branchId);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!code.trim()) {
      setFormError(t("devices.agent.form.codeRequired"));
      return;
    }
    if (!name.trim()) {
      setFormError(t("devices.agent.form.nameRequired"));
      return;
    }

    try {
      const agent = await createMutation.mutateAsync({ code: code.trim(), name: name.trim() });
      toast.success(t("devices.toast.agentCreated"));
      onSuccess(agent);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <DevicesModal title={t("devices.agent.new")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {formError && (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {formError}
          </div>
        )}

        <label className="block text-xs font-semibold text-slate-400">
          {t("devices.agent.code")}
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            maxLength={50}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
          />
        </label>
        <label className="block text-xs font-semibold text-slate-400">
          {t("devices.agent.name")}
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={200}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
          />
        </label>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createMutation.isPending ? t("devices.actions.saving") : t("devices.agent.new")}
        </button>
      </form>
    </DevicesModal>
  );
}
