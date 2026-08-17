import { zodResolver } from "@hookform/resolvers/zod";
import {
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Layers3,
  Package,
  Percent,
  RefreshCw,
  Store,
  Tags,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ApiError } from "../../../shared/api/apiError";
import { LoadingState } from "../../../shared/components/ui";
import { useBranch } from "../../branches/context/BranchContext";
import { useCompany } from "../../companies/context/CompanyContext";
import { useSellableCatalog } from "../../pos/hooks/useSellableCatalog";
import {
  createVariantPriceSchema,
  type VariantPriceFormValues,
} from "../../pricing/schemas/setVariantPrice.schema";
import { usePriceLists, useSetProductVariantPrice } from "../../pricing/hooks/usePricing";
import {
  useCompanyTaxSettings,
  useCreateTaxCategory,
  useSetProductSalesTaxCategory,
  useTaxCategories,
} from "../../tax/hooks/useTax";
import {
  firstTaxCategorySchema,
  type FirstTaxCategoryFormValues,
} from "../../tax/schemas/firstTaxCategory.schema";
import {
  useActiveUnitsOfMeasure,
  useCategories,
  useCreateCategory,
  useCreateProduct,
  useCreateProductVariant,
  useSetBranchProductVariantAvailability,
} from "../hooks/useCatalog";
import {
  firstCategorySchema,
  firstProductSchema,
  firstVariantSchema,
  type FirstCategoryFormValues,
  type FirstProductFormValues,
  type FirstVariantFormValues,
} from "../schemas/firstProduct.schema";

const VALIDATION_MESSAGES: Record<string, string> = {
  "category.nameRequired": "Category name is required.",
  "category.nameTooLong": "Category name is too long.",
  "product.nameRequired": "Product name is required.",
  "product.nameTooLong": "Product name is too long.",
  "variant.nameRequired": "Variant name is required.",
  "variant.nameTooLong": "Variant name is too long.",
  "variant.skuTooLong": "SKU is too long.",
  "variant.uomRequired": "Select a unit of measure.",
  variantPriceRequired: "Enter a price.",
  variantPriceNumber: "Enter a valid number.",
  variantPriceMin: "Price must be zero or greater.",
  variantPricePrecision: "Too many decimal places for this currency.",
  "taxCategory.codeRequired": "Tax category code is required.",
  "taxCategory.codeTooLong": "Tax category code is too long.",
  "taxCategory.nameRequired": "Tax category name is required.",
  "taxCategory.nameTooLong": "Tax category name is too long.",
  "taxCategory.rateRequired": "Enter a rate percent.",
  "taxCategory.rateInvalid": "Enter a valid rate between 0 and 100.",
  "taxCategory.rateMustBePositive": "Standard-rated categories must have a rate greater than 0.",
  "taxCategory.rateMustBeZero": "Zero-rated and exempt categories must have a rate of 0.",
};

function fieldMessage(key?: string) {
  if (!key) return undefined;
  return VALIDATION_MESSAGES[key] || key;
}

function mapStepError(error: ApiError) {
  switch (error.code) {
    case "Category.ParentNotAvailable":
      return "The selected parent category is unavailable.";
    case "Category.InvalidInput":
      return "Please check the category name.";
    case "Product.CategoryNotAvailable":
      return "The selected category is unavailable. Choose another or skip.";
    case "Product.InvalidInput":
      return "Please check the product details.";
    case "Product.NotAvailable":
      return "The product is unavailable.";
    case "UnitOfMeasure.NotAvailable":
      return "Select a valid unit of measure.";
    case "ProductVariant.InvalidInput":
      return "Please check the variant details.";
    case "ProductVariant.SkuAlreadyExists":
      return "This SKU is already used by another variant.";
    case "ProductVariant.NotAvailable":
      return "The product variant is unavailable.";
    case "Branch.NotAvailable":
      return "The current branch is unavailable.";
    case "TaxCategory.InvalidInput":
      return "Please check the tax category details.";
    case "TaxCategory.CodeAlreadyExists":
      return "This tax category code is already used.";
    case "TaxCategory.NotAvailable":
      return "The selected tax category is unavailable.";
    case "Company.NotAccessible":
      return "This company is not accessible.";
    case "Authorization.PermissionDenied":
      return "You do not have permission to perform this action.";
    case "Authentication.Unauthenticated":
      return "Your session has expired. Please sign in again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-60";

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
      {message}
    </div>
  );
}

function StepButton({
  label,
  pending,
  type = "button",
  onClick,
  disabled,
}: {
  label: string;
  pending?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || pending}
      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-blue-600 to-[#0A84FF] text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-55"
    >
      {pending ? <RefreshCw size={16} className="animate-spin" /> : null}
      {label}
    </button>
  );
}

type CategoryStepProps = {
  companyId: string | null;
  branchId: string | null;
  onDone: (categoryId: string | null, categoryLabel: string) => void;
};

function CategoryStep({ companyId, branchId, onDone }: CategoryStepProps) {
  const categoriesQuery = useCategories(companyId, { status: "Active" });
  const mutation = useCreateCategory(companyId, branchId);
  const [selection, setSelection] = useState("skip");
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FirstCategoryFormValues>({
    resolver: zodResolver(firstCategorySchema),
    defaultValues: { name: "" },
  });

  if (categoriesQuery.isLoading) return <LoadingState label="Loading categories..." />;

  const categories = categoriesQuery.data || [];

  const handleContinue = () => {
    if (selection === "skip") {
      onDone(null, "None");
      return;
    }
    const category = categories.find((c) => c.categoryId === selection);
    onDone(selection, category?.name || "");
  };

  const onCreate = async (values: FirstCategoryFormValues) => {
    setFormError("");
    try {
      const created = await mutation.mutateAsync({
        name: values.name.trim(),
        parentCategoryId: null,
        sortOrder: 0,
      });
      onDone(created.categoryId, created.name);
    } catch (error) {
      setFormError(mapStepError(error as ApiError));
    }
  };

  return (
    <div className="grid gap-3">
      <label className="block">
        <span className="text-xs font-bold text-slate-300">Category (optional)</span>
        <select
          value={selection}
          onChange={(event) => setSelection(event.target.value)}
          className={inputClass}
        >
          <option value="skip">No category</option>
          <option value="new">+ Create new category</option>
          {categories.map((category) => (
            <option key={category.categoryId} value={category.categoryId}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {selection === "new" ? (
        <form onSubmit={handleSubmit(onCreate)} className="grid gap-3">
          <label className="block">
            <span className="text-xs font-bold text-slate-300">New Category Name</span>
            <input
              type="text"
              disabled={isSubmitting}
              {...register("name")}
              className={inputClass}
            />
            {fieldMessage(errors.name?.message) && (
              <span className="mt-1.5 block text-xs text-rose-300">
                {fieldMessage(errors.name?.message)}
              </span>
            )}
          </label>
          {formError && <ErrorBanner message={formError} />}
          <StepButton type="submit" pending={isSubmitting || mutation.isPending} label="Create & Continue" />
        </form>
      ) : (
        <>
          {formError && <ErrorBanner message={formError} />}
          <StepButton onClick={handleContinue} label="Continue" />
        </>
      )}
    </div>
  );
}

type ProductStepProps = {
  companyId: string | null;
  branchId: string | null;
  categoryId: string | null;
  categoryLabel: string;
  onDone: (productId: string, productName: string) => void;
};

function ProductStep({ companyId, branchId, categoryId, categoryLabel, onDone }: ProductStepProps) {
  const mutation = useCreateProduct(companyId, branchId);
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FirstProductFormValues>({
    resolver: zodResolver(firstProductSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (values: FirstProductFormValues) => {
    setFormError("");
    try {
      const created = await mutation.mutateAsync({
        name: values.name.trim(),
        description: null,
        categoryId,
        sortOrder: 0,
        imageUrl: null,
      });
      onDone(created.productId, created.name);
    } catch (error) {
      setFormError(mapStepError(error as ApiError));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      <p className="text-xs text-gray-500">
        Category: <span className="text-gray-300">{categoryLabel}</span>
      </p>
      <label className="block">
        <span className="text-xs font-bold text-slate-300">Product Name</span>
        <input
          type="text"
          disabled={isSubmitting}
          {...register("name")}
          className={inputClass}
        />
        {fieldMessage(errors.name?.message) && (
          <span className="mt-1.5 block text-xs text-rose-300">
            {fieldMessage(errors.name?.message)}
          </span>
        )}
      </label>
      {formError && <ErrorBanner message={formError} />}
      <StepButton type="submit" pending={isSubmitting || mutation.isPending} label="Create & Continue" />
    </form>
  );
}

type VariantStepProps = {
  companyId: string | null;
  branchId: string | null;
  productId: string;
  productName: string;
  onDone: (productVariantId: string, variantName: string) => void;
};

function VariantStep({ companyId, branchId, productId, productName, onDone }: VariantStepProps) {
  const unitsQuery = useActiveUnitsOfMeasure();
  const mutation = useCreateProductVariant(companyId, branchId, productId);
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FirstVariantFormValues>({
    resolver: zodResolver(firstVariantSchema),
    defaultValues: { name: "", sku: "", salesUnitOfMeasureId: "" },
  });

  if (unitsQuery.isLoading) return <LoadingState label="Loading units of measure..." />;

  const units = unitsQuery.data || [];

  const onSubmit = async (values: FirstVariantFormValues) => {
    setFormError("");
    try {
      const created = await mutation.mutateAsync({
        name: values.name.trim(),
        sku: values.sku?.trim() || null,
        salesUnitOfMeasureId: values.salesUnitOfMeasureId,
        sortOrder: 0,
      });
      onDone(created.productVariantId, created.name);
    } catch (error) {
      const apiError = error as ApiError;
      const message = mapStepError(apiError);

      if (apiError.code === "ProductVariant.SkuAlreadyExists") {
        setError("sku", { message });
        return;
      }
      if (apiError.code === "UnitOfMeasure.NotAvailable") {
        setError("salesUnitOfMeasureId", { message });
        return;
      }

      setFormError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      <p className="text-xs text-gray-500">
        Product: <span className="text-gray-300">{productName}</span>
      </p>
      <label className="block">
        <span className="text-xs font-bold text-slate-300">Variant Name</span>
        <input
          type="text"
          disabled={isSubmitting}
          {...register("name")}
          className={inputClass}
        />
        {fieldMessage(errors.name?.message) && (
          <span className="mt-1.5 block text-xs text-rose-300">
            {fieldMessage(errors.name?.message)}
          </span>
        )}
      </label>
      <label className="block">
        <span className="text-xs font-bold text-slate-300">SKU (optional)</span>
        <input
          type="text"
          disabled={isSubmitting}
          {...register("sku")}
          className={inputClass}
        />
        {fieldMessage(errors.sku?.message) && (
          <span className="mt-1.5 block text-xs text-rose-300">
            {fieldMessage(errors.sku?.message)}
          </span>
        )}
      </label>
      <label className="block">
        <span className="text-xs font-bold text-slate-300">Sales Unit of Measure</span>
        <select disabled={isSubmitting} {...register("salesUnitOfMeasureId")} className={inputClass}>
          <option value="">Select unit</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.code} - {unit.name}
            </option>
          ))}
        </select>
        {fieldMessage(errors.salesUnitOfMeasureId?.message) && (
          <span className="mt-1.5 block text-xs text-rose-300">
            {fieldMessage(errors.salesUnitOfMeasureId?.message)}
          </span>
        )}
      </label>
      {formError && <ErrorBanner message={formError} />}
      <StepButton type="submit" pending={isSubmitting || mutation.isPending} label="Create & Continue" />
    </form>
  );
}

type PriceStepProps = {
  companyId: string | null;
  branchId: string | null;
  productVariantId: string;
  variantName: string;
  onDone: () => void;
};

function PriceStep({ companyId, branchId, productVariantId, variantName, onDone }: PriceStepProps) {
  const priceListsQuery = usePriceLists(companyId, { status: "Active" });
  const defaultPriceList = priceListsQuery.data?.items.find((priceList) => priceList.isDefault);
  const [formError, setFormError] = useState("");
  const mutation = useSetProductVariantPrice(
    companyId,
    branchId,
    defaultPriceList?.priceListId,
    productVariantId,
  );
  const schema = useMemo(
    () => createVariantPriceSchema(defaultPriceList?.currencyCode),
    [defaultPriceList?.currencyCode],
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VariantPriceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "" },
  });

  if (priceListsQuery.isLoading) return <LoadingState label="Loading price list..." />;

  if (!defaultPriceList) {
    return (
      <ErrorBanner message="No active default price list was found for this company." />
    );
  }

  const onSubmit = async (values: VariantPriceFormValues) => {
    setFormError("");
    try {
      await mutation.mutateAsync({ amount: Number(values.amount) });
      onDone();
    } catch (error) {
      setFormError(mapStepError(error as ApiError));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      <p className="text-xs text-gray-500">
        Variant: <span className="text-gray-300">{variantName}</span>
      </p>
      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300">
        Price List: <span className="font-bold text-white">{defaultPriceList.name}</span>
        {" · "}Currency: <span className="font-bold text-white">{defaultPriceList.currencyCode}</span>
      </div>
      <label className="block">
        <span className="text-xs font-bold text-slate-300">
          Amount ({defaultPriceList.currencyCode})
        </span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          disabled={isSubmitting}
          {...register("amount")}
          className={inputClass}
        />
        {fieldMessage(errors.amount?.message) && (
          <span className="mt-1.5 block text-xs text-rose-300">
            {fieldMessage(errors.amount?.message)}
          </span>
        )}
      </label>
      {formError && <ErrorBanner message={formError} />}
      <StepButton type="submit" pending={isSubmitting || mutation.isPending} label="Set Price & Continue" />
    </form>
  );
}

type AvailabilityStepProps = {
  companyId: string | null;
  branchId: string | null;
  productVariantId: string;
  variantName: string;
  onDone: () => void;
};

function AvailabilityStep({
  companyId,
  branchId,
  productVariantId,
  variantName,
  onDone,
}: AvailabilityStepProps) {
  const [formError, setFormError] = useState("");
  const mutation = useSetBranchProductVariantAvailability(companyId, branchId, productVariantId);

  const handleActivate = async () => {
    setFormError("");
    try {
      await mutation.mutateAsync({ isAvailable: true });
      onDone();
    } catch (error) {
      setFormError(mapStepError(error as ApiError));
    }
  };

  return (
    <div className="grid gap-3">
      <p className="text-xs text-gray-500">
        Make <span className="font-bold text-white">{variantName}</span> available for sale
        in the current branch.
      </p>
      {formError && <ErrorBanner message={formError} />}
      <StepButton onClick={handleActivate} pending={mutation.isPending} label="Make Available & Continue" />
    </div>
  );
}

type TaxCategoryStepProps = {
  companyId: string | null;
  branchId: string | null;
  productId: string;
  productName: string;
  onDone: () => void;
};

function TaxCategoryStep({
  companyId,
  branchId,
  productId,
  productName,
  onDone,
}: TaxCategoryStepProps) {
  const categoriesQuery = useTaxCategories(companyId, { status: "Active" });
  const assignMutation = useSetProductSalesTaxCategory(companyId, branchId, productId);
  const createMutation = useCreateTaxCategory(companyId, branchId);
  const [selection, setSelection] = useState("new");
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FirstTaxCategoryFormValues>({
    resolver: zodResolver(firstTaxCategorySchema),
    defaultValues: { code: "", name: "", treatment: "StandardRated", ratePercent: "" },
  });

  if (categoriesQuery.isLoading) return <LoadingState label="Loading tax categories..." />;

  const categories = categoriesQuery.data || [];

  const assignAndFinish = async (taxCategoryId: string) => {
    setFormError("");
    try {
      await assignMutation.mutateAsync({ taxCategoryId });
      onDone();
    } catch (error) {
      setFormError(mapStepError(error as ApiError));
    }
  };

  const handleContinue = () => {
    if (selection === "new") return;
    assignAndFinish(selection);
  };

  const onCreate = async (values: FirstTaxCategoryFormValues) => {
    setFormError("");
    try {
      const created = await createMutation.mutateAsync({
        code: values.code.trim(),
        name: values.name.trim(),
        treatment: values.treatment,
        ratePercent: Number(values.ratePercent),
      });
      await assignAndFinish(created.taxCategoryId);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.code === "TaxCategory.CodeAlreadyExists") {
        setError("code", { message: mapStepError(apiError) });
        return;
      }
      setFormError(mapStepError(apiError));
    }
  };

  return (
    <div className="grid gap-3">
      <p className="text-xs text-gray-500">
        Product: <span className="text-gray-300">{productName}</span>
      </p>
      <label className="block">
        <span className="text-xs font-bold text-slate-300">Tax Category</span>
        <select
          value={selection}
          onChange={(event) => setSelection(event.target.value)}
          className={inputClass}
        >
          <option value="new">+ Create new tax category</option>
          {categories.map((category) => (
            <option key={category.taxCategoryId} value={category.taxCategoryId}>
              {category.code} · {category.name} · {category.treatment} · {category.ratePercent}%
            </option>
          ))}
        </select>
      </label>

      {selection === "new" ? (
        <form onSubmit={handleSubmit(onCreate)} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold text-slate-300">Code</span>
              <input
                type="text"
                disabled={isSubmitting}
                {...register("code")}
                className={inputClass}
              />
              {fieldMessage(errors.code?.message) && (
                <span className="mt-1.5 block text-xs text-rose-300">
                  {fieldMessage(errors.code?.message)}
                </span>
              )}
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-300">Name</span>
              <input
                type="text"
                disabled={isSubmitting}
                {...register("name")}
                className={inputClass}
              />
              {fieldMessage(errors.name?.message) && (
                <span className="mt-1.5 block text-xs text-rose-300">
                  {fieldMessage(errors.name?.message)}
                </span>
              )}
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-300">Treatment</span>
              <select disabled={isSubmitting} {...register("treatment")} className={inputClass}>
                <option value="StandardRated">StandardRated</option>
                <option value="ZeroRated">ZeroRated</option>
                <option value="Exempt">Exempt</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-300">Rate Percent</span>
              <input
                type="text"
                inputMode="decimal"
                disabled={isSubmitting}
                {...register("ratePercent")}
                className={inputClass}
              />
              {fieldMessage(errors.ratePercent?.message) && (
                <span className="mt-1.5 block text-xs text-rose-300">
                  {fieldMessage(errors.ratePercent?.message)}
                </span>
              )}
            </label>
          </div>
          {formError && <ErrorBanner message={formError} />}
          <StepButton
            type="submit"
            pending={isSubmitting || createMutation.isPending || assignMutation.isPending}
            label="Create & Assign"
          />
        </form>
      ) : (
        <>
          {formError && <ErrorBanner message={formError} />}
          <StepButton onClick={handleContinue} pending={assignMutation.isPending} label="Assign & Continue" />
        </>
      )}
    </div>
  );
}

type DoneStepProps = {
  companyId: string | null;
  branchId: string | null;
  productVariantId: string;
  productName: string;
  onReturn: () => void;
};

function DoneStep({ companyId, branchId, productVariantId, productName, onReturn }: DoneStepProps) {
  const catalogQuery = useSellableCatalog(companyId, branchId, true);
  const isPresent = Boolean(
    catalogQuery.data?.items.some((item) => item.productVariantId === productVariantId),
  );

  if (!isPresent && (catalogQuery.isLoading || catalogQuery.isFetching)) {
    return <LoadingState label="Finishing setup..." />;
  }

  if (!isPresent) {
    return (
      <div className="grid gap-3 text-center">
        <p className="text-xs text-gray-400">
          Setup is complete, but the product has not appeared in the sellable catalog yet.
        </p>
        <StepButton onClick={() => catalogQuery.refetch()} label="Check again" />
      </div>
    );
  }

  return (
    <div className="grid gap-3 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
        <CheckCircle2 size={26} className="text-emerald-300" />
      </div>
      <h2 className="text-lg font-bold text-white">Your first product is ready for sale.</h2>
      <p className="text-xs text-gray-400">{productName} is now available in POS.</p>
      <StepButton onClick={onReturn} label="Return to POS" />
    </div>
  );
}

type WizardStep =
  | "category"
  | "product"
  | "variant"
  | "price"
  | "availability"
  | "taxCategory"
  | "done";

const STEP_LABELS: Record<WizardStep, string> = {
  category: "Category",
  product: "Product",
  variant: "Variant",
  price: "Price",
  availability: "Availability",
  taxCategory: "Tax Category",
  done: "Done",
};
const STEP_ICONS: Record<WizardStep, typeof Tags> = {
  category: Tags,
  product: Package,
  variant: Layers3,
  price: CircleDollarSign,
  availability: Store,
  taxCategory: Percent,
  done: CheckCircle2,
};

type FirstProductOnboardingProps = {
  onCompleted?: () => void;
};

export function FirstProductOnboarding({ onCompleted }: FirstProductOnboardingProps) {
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const taxSettingsQuery = useCompanyTaxSettings(currentCompanyId);
  const isTaxEnabled = Boolean(taxSettingsQuery.data?.isTaxEnabled);
  const [step, setStep] = useState<WizardStep>("category");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryLabel, setCategoryLabel] = useState("None");
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productVariantId, setProductVariantId] = useState<string | null>(null);
  const [variantName, setVariantName] = useState("");

  const stepOrder: WizardStep[] = isTaxEnabled
    ? ["category", "product", "variant", "price", "availability", "taxCategory", "done"]
    : ["category", "product", "variant", "price", "availability", "done"];
  const stepIndex = stepOrder.indexOf(step);
  const StepIcon = STEP_ICONS[step];

  return (
    <section className="panel rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
          <Boxes size={20} />
        </div>
        <div>
          <h1 className="brand-text text-xl font-black">Catalog Setup</h1>
          <p className="text-xs text-gray-400">
            There are no products ready for sale in this branch yet. Add your first
            sellable product to start using POS.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-1.5">
        {stepOrder.map((wizardStep, index) => (
          <div
            key={wizardStep}
            className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? "bg-blue-500" : "bg-white/10"}`}
          />
        ))}
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
        <StepIcon size={13} />
        Step {stepIndex + 1} of {stepOrder.length} · {STEP_LABELS[step]}
      </p>

      <div className="mt-5">
        {step === "category" && (
          <CategoryStep
            companyId={currentCompanyId}
            branchId={currentBranchId}
            onDone={(id, label) => {
              setCategoryId(id);
              setCategoryLabel(label);
              setStep("product");
            }}
          />
        )}
        {step === "product" && (
          <ProductStep
            companyId={currentCompanyId}
            branchId={currentBranchId}
            categoryId={categoryId}
            categoryLabel={categoryLabel}
            onDone={(id, name) => {
              setProductId(id);
              setProductName(name);
              setStep("variant");
            }}
          />
        )}
        {step === "variant" && productId && (
          <VariantStep
            companyId={currentCompanyId}
            branchId={currentBranchId}
            productId={productId}
            productName={productName}
            onDone={(id, name) => {
              setProductVariantId(id);
              setVariantName(name);
              setStep("price");
            }}
          />
        )}
        {step === "price" && productVariantId && (
          <PriceStep
            companyId={currentCompanyId}
            branchId={currentBranchId}
            productVariantId={productVariantId}
            variantName={variantName}
            onDone={() => setStep("availability")}
          />
        )}
        {step === "availability" && productVariantId && (
          <AvailabilityStep
            companyId={currentCompanyId}
            branchId={currentBranchId}
            productVariantId={productVariantId}
            variantName={variantName}
            onDone={() => setStep(isTaxEnabled ? "taxCategory" : "done")}
          />
        )}
        {step === "taxCategory" && productId && (
          <TaxCategoryStep
            companyId={currentCompanyId}
            branchId={currentBranchId}
            productId={productId}
            productName={productName}
            onDone={() => setStep("done")}
          />
        )}
        {step === "done" && productVariantId && (
          <DoneStep
            companyId={currentCompanyId}
            branchId={currentBranchId}
            productVariantId={productVariantId}
            productName={variantName}
            onReturn={() => onCompleted?.()}
          />
        )}
      </div>
    </section>
  );
}
