"use client";

import { CatalogManager } from "@/components/catalog/catalog-manager";

export default function ProductsPage() {
  return (
    <CatalogManager
      type="product"
      title="Products"
      description="Physical or digital goods in your catalog. Shown on your storefront and marketplace."
    />
  );
}
