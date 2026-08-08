import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { getClientDb } from "./client";
import { COLLECTIONS } from "./collections";
import type { CatalogItem, CatalogItemType, ProductStatus } from "@/types";
import { slugify } from "@/lib/utils";

function mapItem(id: string, data: DocumentData): CatalogItem {
  return {
    id,
    vendorId: data.vendorId,
    type: data.type,
    name: data.name,
    slug: data.slug,
    description: data.description,
    shortDescription: data.shortDescription,
    price: data.price ?? 0,
    compareAtPrice: data.compareAtPrice,
    currency: "NGN",
    images: data.images ?? [],
    category: data.category,
    tags: data.tags ?? [],
    status: data.status ?? "draft",
    sku: data.sku,
    stock: data.stock,
    trackInventory: data.trackInventory,
    durationMinutes: data.durationMinutes,
    bookingRequired: data.bookingRequired,
    featured: data.featured ?? false,
    sortOrder: data.sortOrder ?? 0,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

export async function listCatalogItems(
  vendorId: string,
  opts?: { type?: CatalogItemType; status?: ProductStatus }
): Promise<CatalogItem[]> {
  const db = getClientDb();
  const constraints: QueryConstraint[] = [where("vendorId", "==", vendorId)];
  if (opts?.type) constraints.push(where("type", "==", opts.type));
  if (opts?.status) constraints.push(where("status", "==", opts.status));
  constraints.push(orderBy("createdAt", "desc"));

  const q = query(collection(db, COLLECTIONS.catalog), ...constraints);
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => mapItem(d.id, d.data()));
}

/** Public marketplace catalog — active items across all vendors. */
export async function listPublicCatalogItems(opts?: {
  type?: CatalogItemType;
  limitCount?: number;
}): Promise<CatalogItem[]> {
  const db = getClientDb();
  const constraints: QueryConstraint[] = [where("status", "==", "active")];
  if (opts?.type) constraints.push(where("type", "==", opts.type));
  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(opts?.limitCount ?? 48));

  const q = query(collection(db, COLLECTIONS.catalog), ...constraints);
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => mapItem(d.id, d.data()));
}

export async function getCatalogItem(id: string): Promise<CatalogItem | null> {
  const db = getClientDb();
  const snap = await getDoc(doc(db, COLLECTIONS.catalog, id));
  if (!snap.exists()) return null;
  return mapItem(snap.id, snap.data());
}

export async function createCatalogItem(
  input: Omit<CatalogItem, "id" | "createdAt" | "updatedAt" | "currency" | "slug"> & {
    slug?: string;
  }
): Promise<CatalogItem> {
  const db = getClientDb();
  const ref = doc(collection(db, COLLECTIONS.catalog));
  const slug = input.slug ? slugify(input.slug) : slugify(input.name) || ref.id.slice(0, 8);

  const payload = {
    vendorId: input.vendorId,
    type: input.type,
    name: input.name.trim(),
    slug,
    description: input.description ?? "",
    shortDescription: input.shortDescription ?? "",
    price: Number(input.price) || 0,
    compareAtPrice: input.compareAtPrice ?? null,
    currency: "NGN" as const,
    images: input.images ?? [],
    category: input.category ?? "",
    tags: input.tags ?? [],
    status: input.status ?? "draft",
    sku: input.sku ?? "",
    stock: input.stock ?? null,
    trackInventory: input.trackInventory ?? false,
    durationMinutes: input.durationMinutes ?? null,
    bookingRequired: input.bookingRequired ?? false,
    featured: input.featured ?? false,
    sortOrder: input.sortOrder ?? 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload);

  // bump vendor stats (best-effort)
  try {
    const vendorRef = doc(db, COLLECTIONS.vendors, input.vendorId);
    const vendorSnap = await getDoc(vendorRef);
    if (vendorSnap.exists()) {
      const stats = vendorSnap.data().stats ?? {
        productCount: 0,
        serviceCount: 0,
        orderCount: 0,
        viewCount: 0,
      };
      if (input.type === "product") stats.productCount = (stats.productCount ?? 0) + 1;
      if (input.type === "service") stats.serviceCount = (stats.serviceCount ?? 0) + 1;
      await updateDoc(vendorRef, { stats, updatedAt: serverTimestamp() });
    }
  } catch {
    /* non-blocking */
  }

  return mapItem(ref.id, payload);
}

export async function updateCatalogItem(
  id: string,
  data: Partial<
    Pick<
      CatalogItem,
      | "name"
      | "description"
      | "shortDescription"
      | "price"
      | "compareAtPrice"
      | "images"
      | "category"
      | "tags"
      | "status"
      | "sku"
      | "stock"
      | "trackInventory"
      | "durationMinutes"
      | "bookingRequired"
      | "featured"
      | "sortOrder"
    >
  >
): Promise<void> {
  const db = getClientDb();
  await updateDoc(doc(db, COLLECTIONS.catalog, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCatalogItem(id: string): Promise<void> {
  const db = getClientDb();
  await deleteDoc(doc(db, COLLECTIONS.catalog, id));
}
