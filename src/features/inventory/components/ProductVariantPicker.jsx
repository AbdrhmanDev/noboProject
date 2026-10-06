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
      <label className="text-sm font-semibold text-muted">
        Product
        <select
          value={productId || ""}
          onChange={(event) => onProductChange(event.target.value || null)}
          disabled={!enabled || productsQuery.isLoading}
          className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
        >
          <option value="">Select product...</option>
          {(productsQuery.data?.items || []).map((product) => (
            <option key={product.productId} value={product.productId}>
              {product.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold text-muted">
        Variant
        <select
          value={productVariantId || ""}
          onChange={(event) => onVariantChange(event.target.value || null)}
          disabled={!enabled || !productId || productDetailsQuery.isLoading}
          className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
        >
          <option value="">Select variant...</option>
          {variants.map((variant) => (
            <option key={variant.productVariantId} value={variant.productVariantId}>
              {variant.name}
              {variant.sku ? ` · ${variant.sku}` : ""}
            </option>
          ))}
        </select>
        {!productId && <p className="mt-1 text-xs text-subtle">Select a product first</p>}
      </label>
    </div>
  );
}
