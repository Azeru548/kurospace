import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getClientDb } from "./client";
import { userNotificationsPath } from "./collections";
import type { AppNotification, NotificationType } from "@/types";

function mapNotif(id: string, userId: string, data: DocumentData): AppNotification {
  return {
    id,
    userId,
    vendorId: data.vendorId,
    type: (data.type as NotificationType) ?? "system",
    title: data.title ?? "",
    body: data.body ?? "",
    link: data.link,
    read: Boolean(data.read),
    metadata: data.metadata,
    createdAt: data.createdAt ?? null,
  };
}

export function subscribeNotifications(
  userId: string,
  onData: (items: AppNotification[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const db = getClientDb();
  const q = query(
    collection(db, userNotificationsPath(userId)),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapNotif(d.id, userId, d.data()))),
    (err) => onError?.(err)
  );
}

export function subscribeUnreadCount(
  userId: string,
  onData: (count: number) => void
): Unsubscribe {
  const db = getClientDb();
  const q = query(
    collection(db, userNotificationsPath(userId)),
    where("read", "==", false)
  );
  return onSnapshot(q, (snap) => onData(snap.size));
}

export async function markNotificationRead(userId: string, id: string): Promise<void> {
  const db = getClientDb();
  await updateDoc(doc(db, userNotificationsPath(userId), id), { read: true });
}

export async function markAllNotificationsRead(
  userId: string,
  ids: string[]
): Promise<void> {
  await Promise.all(ids.map((id) => markNotificationRead(userId, id)));
}
