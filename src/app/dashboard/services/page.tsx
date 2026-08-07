"use client";

import { CatalogManager } from "@/components/catalog/catalog-manager";

export default function ServicesPage() {
  return (
    <CatalogManager
      type="service"
      title="Services"
      description="Offerings customers can request or book — tailoring, consulting, delivery, and more."
    />
  );
}
