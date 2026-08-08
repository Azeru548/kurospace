import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { getClientDb } from "./client";
import { COLLECTIONS } from "./collections";
import type { Vendor, VendorBranding } from "@/types";
import { DEFAULT_BRANDING } from "@/types";
import { slugify } from "@/lib/utils";

function mapVendor(id: string, data: DocumentData): Vendor {
  return {
    id,
    ownerId: data.ownerId,
    businessName: data.businessName,
    slug: data.slug,
    description: data.description,
    category: data.category,
    tags: data.tags ?? [],
    logoURL: data.logoURL,
    coverURL: data.coverURL,
    phone: data.phone,
    email: data.email,
    whatsapp: data.whatsapp,
    address: data.address,
    businessHours: data.businessHours,
    branding: { ...DEFAULT_BRANDING, ...data.branding } as VendorBranding,
    plan: data.plan ?? "free",
    storefrontEnabled: data.storefrontEnabled ?? true,
    isPublished: data.isPublished ?? false,
    stats: data.stats,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

export async function isSlugAvailable(slug: string, excludeVendorId?: string): Promise<boolean> {
  const db = getClientDb();
  const ref = doc(db, COLLECTIONS.slugIndex, slug);
  const snap = await getDoc(ref);
  if (!snap.exists()) return true;
  if (excludeVendorId && snap.data()?.vendorId === excludeVendorId) return true;
  return false;
}

export async function generateUniqueSlug(businessName: string): Promise<string> {
  let base = slugify(businessName) || "shop";
  if (base.length < 3) base = `shop-${base}`;
  let candidate = base;
  let n = 0;
  while (!(await isSlugAvailable(candidate))) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

export async function createVendor(input: {
  ownerId: string;
  businessName: string;
  category: string;
  description?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  slug?: string;
}): Promise<Vendor> {
  const db = getClientDb();
  const slug = input.slug
    ? slugify(input.slug)
    : await generateUniqueSlug(input.businessName);

  if (!(await isSlugAvailable(slug))) {
    throw new Error("This store URL is already taken. Pick another.");
  }

  const vendorRef = doc(collection(db, COLLECTIONS.vendors));
  const payload = {
    ownerId: input.ownerId,
    businessName: input.businessName.trim(),
    slug,
    description: input.description?.trim() ?? "",
    category: input.category,
    phone: input.phone ?? "",
    email: input.email ?? "",
    address: {
      city: input.city ?? "",
      state: input.state ?? "",
      country: "NG",
    },
    branding: DEFAULT_BRANDING,
    plan: "free" as const,
    storefrontEnabled: true,
    isPublished: false,
    stats: {
      productCount: 0,
      serviceCount: 0,
      orderCount: 0,
      viewCount: 0,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(vendorRef, payload);
  await setDoc(doc(db, COLLECTIONS.slugIndex, slug), {
    vendorId: vendorRef.id,
    ownerId: input.ownerId,
    createdAt: serverTimestamp(),
  });
  // Link user → vendor
  await updateDoc(doc(db, COLLECTIONS.users, input.ownerId), {
    vendorId: vendorRef.id,
    role: "vendor",
    updatedAt: serverTimestamp(),
  });

  return mapVendor(vendorRef.id, payload);
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  const db = getClientDb();
  const snap = await getDoc(doc(db, COLLECTIONS.vendors, id));
  if (!snap.exists()) return null;
  return mapVendor(snap.id, snap.data());
}

/** Batch-load vendors by id for marketplace/product listing joins. */
export async function getVendorsByIds(ids: string[]): Promise<Map<string, Vendor>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, Vendor>();
  if (!unique.length) return map;

  await Promise.all(
    unique.map(async (id) => {
      const v = await getVendorById(id);
      if (v) map.set(id, v);
    })
  );
  return map;
}

export async function getVendorBySlug(slug: string): Promise<Vendor | null> {
  const db = getClientDb();
  const q = query(
    collection(db, COLLECTIONS.vendors),
    where("slug", "==", slug),
    limit(1)
  );
  const snaps = await getDocs(q);
  if (snaps.empty) return null;
  const d = snaps.docs[0];
  return mapVendor(d.id, d.data());
}

export async function getVendorByOwner(ownerId: string): Promise<Vendor | null> {
  const db = getClientDb();
  const q = query(
    collection(db, COLLECTIONS.vendors),
    where("ownerId", "==", ownerId),
    limit(1)
  );
  const snaps = await getDocs(q);
  if (snaps.empty) return null;
  const d = snaps.docs[0];
  return mapVendor(d.id, d.data());
}

export async function updateVendor(
  vendorId: string,
  data: Partial<
    Pick<
      Vendor,
      | "businessName"
      | "description"
      | "category"
      | "phone"
      | "email"
      | "whatsapp"
      | "logoURL"
      | "coverURL"
      | "address"
      | "isPublished"
      | "storefrontEnabled"
      | "branding"
      | "tags"
    >
  >
): Promise<void> {
  const db = getClientDb();
  await updateDoc(doc(db, COLLECTIONS.vendors, vendorId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateVendorBranding(
  vendorId: string,
  branding: Partial<VendorBranding>
): Promise<void> {
  const vendor = await getVendorById(vendorId);
  if (!vendor) throw new Error("Vendor not found");
  await updateVendor(vendorId, {
    branding: { ...vendor.branding, ...branding },
  });
}
