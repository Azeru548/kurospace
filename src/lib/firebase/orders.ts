import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { getClientDb } from "./client";
import { COLLECTIONS } from "./collections";
import type { CustomerInfo, Order, OrderItem, OrderStatus } from "@/types";

function mapOrder(id: string, data: DocumentData): Order {
  return {
    id,
    vendorId: data.vendorId,
    vendorSlug: data.vendorSlug,
    orderNumber: data.orderNumber,
    items: data.items ?? [],
    customer: data.customer,
    status: data.status,
    subtotal: data.subtotal ?? 0,
    total: data.total ?? 0,
    currency: "NGN",
    paymentMethod: data.paymentMethod ?? "manual",
    paymentStatus: data.paymentStatus ?? "unpaid",
    paymentRef: data.paymentRef,
    bachsCheckoutId: data.bachsCheckoutId,
    bachsChargeId: data.bachsChargeId,
    source: data.source ?? "storefront",
    vendorNotes: data.vendorNotes,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

function generateOrderNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KS-${y}${m}${day}-${rand}`;
}

export async function createOrder(input: {
  vendorId: string;
  vendorSlug: string;
  items: OrderItem[];
  customer: CustomerInfo;
  paymentMethod?: Order["paymentMethod"];
  paymentStatus?: Order["paymentStatus"];
  source?: Order["source"];
}): Promise<Order> {
  const db = getClientDb();
  const ref = doc(collection(db, COLLECTIONS.orders));
  const subtotal = input.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const payload = {
    vendorId: input.vendorId,
    vendorSlug: input.vendorSlug,
    orderNumber: generateOrderNumber(),
    items: input.items,
    customer: input.customer,
    status: "pending" as OrderStatus,
    subtotal,
    total: subtotal,
    currency: "NGN" as const,
    paymentMethod: input.paymentMethod ?? "manual",
    paymentStatus: input.paymentStatus ?? "unpaid",
    source: input.source ?? "storefront",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload);

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
      stats.orderCount = (stats.orderCount ?? 0) + 1;
      await updateDoc(vendorRef, { stats, updatedAt: serverTimestamp() });
    }
  } catch {
    /* non-blocking */
  }

  return mapOrder(ref.id, payload);
}

export async function listVendorOrders(vendorId: string): Promise<Order[]> {
  const db = getClientDb();
  const q = query(
    collection(db, COLLECTIONS.orders),
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc")
  );
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => mapOrder(d.id, d.data()));
}

export async function getOrder(id: string): Promise<Order | null> {
  const db = getClientDb();
  const snap = await getDoc(doc(db, COLLECTIONS.orders, id));
  if (!snap.exists()) return null;
  return mapOrder(snap.id, snap.data());
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  vendorNotes?: string
): Promise<void> {
  const db = getClientDb();
  const patch: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (vendorNotes !== undefined) patch.vendorNotes = vendorNotes;
  await updateDoc(doc(db, COLLECTIONS.orders, id), patch);
}

export async function attachBachsCheckout(
  orderId: string,
  checkoutId: string
): Promise<void> {
  const db = getClientDb();
  await updateDoc(doc(db, COLLECTIONS.orders, orderId), {
    paymentMethod: "bachs",
    paymentStatus: "pending",
    paymentRef: checkoutId,
    bachsCheckoutId: checkoutId,
    updatedAt: serverTimestamp(),
  });
}
