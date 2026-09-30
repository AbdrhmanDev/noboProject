import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useSetCustomerComplianceProfile } from "../hooks/useCustomerComplianceProfile";
import {
  MAX_ADDRESS_PART_LENGTH,
  MAX_OTHER_IDENTIFIER_LENGTH,
  OTHER_IDENTIFIER_SCHEMES,
} from "../types/customerCompliance.types";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

const BLANK_ADDRESS = {
  street: "",
  buildingNumber: "",
  additionalNumber: "",
  district: "",
  city: "",
  postalCode: "",
  province: "",
  countryCode: "",
};

const ADDRESS_FIELDS = [
  ["street", "custCompliance.address.street"],
  ["buildingNumber", "custCompliance.address.buildingNumber"],
  ["additionalNumber", "custCompliance.address.additionalNumber"],
  ["district", "custCompliance.address.district"],
  ["city", "custCompliance.address.city"],
  ["postalCode", "custCompliance.address.postalCode"],
  ["province", "custCompliance.address.province"],
  ["countryCode", "custCompliance.address.countryCode"],
];

// companyId + customer (the real, backend Customer record -- customerId/name/taxNumber/address
// all already come from GET /customers, never invented here) -> the ONE existing PUT endpoint.
// canManage gates the actual submit (Customers.Manage); a viewer with only Customers.View can
// still open this to see what was saved earlier in the session, read-only.
//
// `cachedProfile` is whatever THIS session already saved for this exact customer (resolved by the
// caller BEFORE this component mounts -- see CustomersPage's host wrapper -- so every field below
// can initialize straight from it with a plain lazy useState, no effect needed to "catch up" once
// data arrives). Never guesses a value the cache does not actually hold: no cached profile => every
// field starts genuinely blank, not pre-filled from the customer's name/VAT/free-text address.
export function CustomerComplianceProfileForm({ companyId, customer, canManage, cachedProfile, onClose }) {
  const { t } = useI18n();
  const setProfile = useSetCustomerComplianceProfile(companyId);

  const [classification, setClassification] = useState(() =>
    cachedProfile?.classification === "Consumer" || cachedProfile?.classification === "Business"
      ? cachedProfile.classification
      : "",
  );
  const [otherIdentifier, setOtherIdentifier] = useState(() => cachedProfile?.otherIdentifier || "");
  const [otherIdentifierScheme, setOtherIdentifierScheme] = useState(() => cachedProfile?.otherIdentifierScheme || "");
  const [address, setAddress] = useState(() => {
    const a = cachedProfile?.structuredAddress;
    return a
      ? {
          street: a.street || "",
          buildingNumber: a.buildingNumber || "",
          additionalNumber: a.additionalNumber || "",
          district: a.district || "",
          city: a.city || "",
          postalCode: a.postalCode || "",
          province: a.province || "",
          countryCode: a.countryCode || "",
        }
      : BLANK_ADDRESS;
  });
  const [justSaved, setJustSaved] = useState(false);

  if (!customer) return null;

  const setAddressField = (field, value) => setAddress((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!canManage || setProfile.isPending) return;

    const trimmedIdentifier = otherIdentifier.trim();
    const trimmedAddress = Object.fromEntries(
      Object.entries(address).map(([key, value]) => [key, value.trim() || null]),
    );
    const hasAnyAddressValue = Object.values(trimmedAddress).some(Boolean);

    setJustSaved(false);
    try {
      await setProfile.mutateAsync({
        customerId: customer.customerId,
        payload: {
          classification: classification || null,
          otherIdentifier: trimmedIdentifier || null,
          // The scheme only means something alongside an identifier -- never sent on its own.
          otherIdentifierScheme: trimmedIdentifier ? otherIdentifierScheme || null : null,
          // null = "no structured address stated" (the backend's own documented clear semantics);
          // an object is only sent once the cashier has actually entered at least one field.
          structuredAddress: hasAnyAddressValue ? trimmedAddress : null,
        },
      });
      setJustSaved(true);
    } catch {
      // setProfile.error already carries the failure; nothing else to do here.
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 text-xs">
      {!canManage && (
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-amber-200">
          {t("custCompliance.viewOnly")}
        </div>
      )}

      <p className="text-gray-400">{t("custCompliance.subtitle")}</p>

      {/* ---- classification ---- */}
      <div>
        <div className="mb-1.5 text-[11px] font-bold text-gray-400">{t("custCompliance.classification.label")}</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["", "custCompliance.classification.notSpecified"],
            ["Consumer", "custCompliance.classification.consumer"],
            ["Business", "custCompliance.classification.business"],
          ].map(([value, labelKey]) => (
            <button
              key={value || "none"}
              type="button"
              disabled={!canManage}
              onClick={() => setClassification(value)}
              className={`rounded-xl border px-2 py-2 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                classification === value
                  ? "border-blue-400 bg-blue-500/15 text-blue-300"
                  : "input-dark border-transparent text-gray-300"
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* ---- other identifier ---- */}
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-bold text-gray-400">{t("custCompliance.otherIdentifier.label")}</span>
          {customer.taxNumber && (
            <span className="text-[10px] text-gray-500">{t("custCompliance.otherIdentifier.vatHint", { value: customer.taxNumber })}</span>
          )}
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            value={otherIdentifier}
            onChange={(event) => setOtherIdentifier(event.target.value)}
            disabled={!canManage}
            placeholder={t("custCompliance.otherIdentifier.placeholder")}
            maxLength={MAX_OTHER_IDENTIFIER_LENGTH}
            className="input-dark h-10 rounded-xl px-3 text-xs outline-none disabled:opacity-50"
          />
          <select
            value={otherIdentifierScheme}
            onChange={(event) => setOtherIdentifierScheme(event.target.value)}
            disabled={!canManage || !otherIdentifier.trim()}
            className="input-dark h-10 rounded-xl px-2 text-xs outline-none disabled:opacity-50"
          >
            <option value="">{t("custCompliance.otherIdentifier.schemePlaceholder")}</option>
            {OTHER_IDENTIFIER_SCHEMES.map((code) => (
              <option key={code} value={code}>
                {t(`custCompliance.scheme.${code}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---- structured address ---- */}
      <div>
        <div className="mb-1 text-[11px] font-bold text-gray-400">{t("custCompliance.address.title")}</div>
        <p className="mb-2 text-[10.5px] text-gray-500">{t("custCompliance.address.hint")}</p>
        {customer.address && (
          <div className="mb-2 rounded-xl border border-white/5 bg-black/10 p-2 text-[10.5px] text-gray-500">
            {t("custCompliance.address.freeTextLabel")}: <span className="text-gray-400">{customer.address}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {ADDRESS_FIELDS.map(([field, labelKey]) => (
            <label key={field} className="block text-[11px] font-bold text-gray-400">
              {t(labelKey)}
              <input
                value={address[field]}
                onChange={(event) => setAddressField(field, event.target.value)}
                disabled={!canManage}
                maxLength={MAX_ADDRESS_PART_LENGTH}
                className="input-dark mt-1 h-10 w-full rounded-xl px-3 text-xs font-normal outline-none disabled:opacity-50"
              />
            </label>
          ))}
        </div>
      </div>

      {/* The actual wire shape (ApplicationResultHttpMapper.ToHttpFailure -> Results.Problem with an
          `errors: [{ code, message }]` extension array, NOT a field->messages dictionary): always a
          single human-readable message here, exactly like every other error surface in this app
          (see PosMiscDialogs' own getErrorMessage). Nothing per-field is invented on top of it. */}
      {setProfile.isError && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-red-200">
          {getErrorMessage(setProfile.error)}
        </div>
      )}

      {justSaved && !setProfile.isPending && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-emerald-200">
          <CircleCheck size={14} />
          {t("custCompliance.success")}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="input-dark h-10 flex-1 rounded-xl text-xs font-bold"
        >
          {t("common.close")}
        </button>
        {canManage && (
          <button
            type="submit"
            disabled={setProfile.isPending}
            className="primary-btn h-10 flex-1 rounded-xl text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {setProfile.isPending ? t("custCompliance.saving") : t("custCompliance.save")}
          </button>
        )}
      </div>
    </form>
  );
}
