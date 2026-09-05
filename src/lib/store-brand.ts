import { DEFAULT_BRANDING, type Vendor, type VendorBranding } from "@/types";

export function storeBrand(vendor?: Vendor | null): VendorBranding {
  return { ...DEFAULT_BRANDING, ...vendor?.branding };
}
