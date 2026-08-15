import { useProductDetails, useProducts } from "../../catalog/hooks/useCatalog";

export function ProductVariantPicker({
  companyId,
  enabled,
  productId,
  onProductChange,
  productVariantId,
  onVariantChange,
}) {
  const productsQuery = useProducts(companyId, { status: "Active" }, enabled);
  const productDetailsQuery = useProductDetails(companyId, productId, enabled && Boolean(productId));
  const variants = (productDetailsQuery.data?.variants || []).filter(
    (variant) => variant.status === "Active",
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-semibold text-slate-400">
        Product
        <select
          value={productId || ""}
          onChange={(event) => onProductChange(event.target.value || null)}
          disabled={!enabled || productsQuery.isLoading}
          className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
        >
          <option value="">Select product...</option>
          {(productsQuery.data?.items || []).map((product) => (
            <option key={product.productId} value={product.productId}>
              {product.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold text-slate-400">
        Variant
        <select
          value={productVariantId || ""}
          onChange={(event) => onVariantChange(event.target.value || null)}
          disabled={!enabled || !productId || productDetailsQuery.isLoading}
          className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
        >
          <option value="">Select variant...</option>
          {variants.map((variant) => (
            <option key={variant.productVariantId} value={variant.productVariantId}>
              {variant.name}
              {variant.sku ? ` · ${variant.sku}` : ""}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
