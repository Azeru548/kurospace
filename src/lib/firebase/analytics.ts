import {
  addDoc,
  collection,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  doc,
  type DocumentData,
} from "firebase/firestore";
import { getClientDb } from "./client";
import { COLLECTIONS } from "./collections";
import type { AnalyticsEvent } from "@/types";

function mapEvent(id: string, data: DocumentData): AnalyticsEvent {
  return {
    id,
    vendorId: data.vendorId,
    type: data.type,
    path: data.path,
    catalogItemId: data.catalogItemId,
    referrer: data.referrer,
    createdAt: data.createdAt ?? null,
  };
}

export async function trackAnalyticsEvent(input: {
  vendorId: string;
  type: AnalyticsEvent["type"];
  path?: string;
  catalogItemId?: string;
  dedupeKey?: string;
}): Promise<void> {
  if (typeof window !== "undefined" && input.dedupeKey) {
    const key = `kuro_analytics_${input.dedupeKey}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode */
    }
  }

  const db = getClientDb();
  await addDoc(collection(db, COLLECTIONS.analytics), {
    vendorId: input.vendorId,
    type: input.type,
    path: input.path ?? "",
    catalogItemId: input.catalogItemId ?? null,
    referrer: typeof document !== "undefined" ? document.referrer || "" : "",
    createdAt: serverTimestamp(),
  });

  if (input.type === "page_view" || input.type === "product_view" || input.type === "service_view") {
    try {
      await updateDoc(doc(db, COLLECTIONS.vendors, input.vendorId), {
        "stats.viewCount": increment(1),
      });
    } catch {
      /* stats bump is best-effort */
    }
  }
}

export async function listAnalyticsEvents(
  vendorId: string,
  limitCount = 400
): Promise<AnalyticsEvent[]> {
  const db = getClientDb();
  const q = query(
    collection(db, COLLECTIONS.analytics),
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => mapEvent(d.id, d.data()));
}
