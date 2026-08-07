/** Firestore Timestamp-compatible shape (client or admin). */
export type TimestampLike =
  | { seconds: number; nanoseconds: number; toDate: () => Date }
  | Date
  | null;

export type UserRole = "vendor" | "customer" | "admin";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "completed"
  | "cancelled"
  | "rejected";

export type CatalogItemType = "product" | "service";

export type ProductStatus = "draft" | "active" | "archived" | "out_of_stock";

export type NotificationType =
  | "order_placed"
  | "order_updated"
  | "order_cancelled"
  | "system"
  | "storefront";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  photoURL?: string;
  vendorId?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface BusinessHours {
  day: number; // 0 = Sunday
  open: string; // "09:00"
  close: string; // "17:00"
  closed?: boolean;
}

export interface Vendor {
  id: string;
  ownerId: string;
  businessName: string;
  slug: string; // subdomain: {slug}.kurospace.com
  description?: string;
  category: string;
  tags?: string[];
  logoURL?: string;
  coverURL?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country: string; // default NG
  };
  businessHours?: BusinessHours[];
  // Storefront branding
  branding: VendorBranding;
  // Feature flags / plan
  plan: "free" | "starter" | "growth" | "pro";
  storefrontEnabled: boolean;
  isPublished: boolean;
  // Stats (denormalized for dashboard)
  stats?: {
    productCount: number;
    serviceCount: number;
    orderCount: number;
    viewCount: number;
  };
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export type StorefrontLayout = "grid" | "list" | "catalog" | "showcase";
export type StorefrontTheme = "minimal" | "bold" | "elegant" | "marketplace";

export interface VendorBranding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  headingFont?: string;
  theme: StorefrontTheme;
  layout: StorefrontLayout;
  showLogo: boolean;
  showCover: boolean;
  customCss?: string;
}

export const DEFAULT_BRANDING: VendorBranding = {
  primaryColor: "#0F766E",
  secondaryColor: "#134E4A",
  accentColor: "#F59E0B",
  backgroundColor: "#FFFFFF",
  textColor: "#0F172A",
  fontFamily: "Inter",
  headingFont: "Inter",
  theme: "minimal",
  layout: "grid",
  showLogo: true,
  showCover: true,
};

export interface CatalogItem {
  id: string;
  vendorId: string;
  type: CatalogItemType;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number; // NGN kobo or whole naira — we use whole naira
  compareAtPrice?: number;
  currency: "NGN";
  images: string[];
  category?: string;
  tags?: string[];
  status: ProductStatus;
  // Product-specific
  sku?: string;
  stock?: number;
  trackInventory?: boolean;
  // Service-specific
  durationMinutes?: number;
  bookingRequired?: boolean;
  // SEO / display
  featured?: boolean;
  sortOrder?: number;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface OrderItem {
  catalogItemId: string;
  type: CatalogItemType;
  name: string;
  price: number;
  quantity: number;
  imageURL?: string;
  notes?: string;
}

export interface CustomerInfo {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
}

export interface Order {
  id: string;
  vendorId: string;
  vendorSlug: string;
  orderNumber: string; // e.g. KS-20260807-A1B2
  items: OrderItem[];
  customer: CustomerInfo;
  status: OrderStatus;
  subtotal: number;
  total: number;
  currency: "NGN";
  paymentMethod: "bachs" | "bank_transfer" | "manual" | "other";
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  paymentRef?: string;
  bachsCheckoutId?: string;
  bachsChargeId?: string;
  source: "storefront" | "marketplace" | "manual";
  vendorNotes?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface AppNotification {
  id: string;
  userId: string;
  vendorId?: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  metadata?: Record<string, string>;
  createdAt: TimestampLike;
}

export interface AnalyticsEvent {
  id: string;
  vendorId: string;
  type: "page_view" | "product_view" | "service_view" | "order_placed" | "add_to_cart";
  path?: string;
  catalogItemId?: string;
  referrer?: string;
  createdAt: TimestampLike;
}

/** Nigerian business categories (v1). */
export const BUSINESS_CATEGORIES = [
  "Fashion & Apparel",
  "Food & Beverages",
  "Beauty & Personal Care",
  "Electronics & Gadgets",
  "Home & Living",
  "Health & Wellness",
  "Agriculture & Produce",
  "Education & Training",
  "Professional Services",
  "Creative & Media",
  "Automotive",
  "Construction & Trades",
  "Events & Entertainment",
  "Travel & Hospitality",
  "Retail & General Merchandise",
  "Other",
] as const;

export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

export const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "DM Sans",
  "Space Grotesk",
  "Playfair Display",
  "Lora",
  "Montserrat",
  "Nunito",
] as const;
