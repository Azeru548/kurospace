import { doc, getDoc, setDoc, serverTimestamp, type DocumentData } from "firebase/firestore";
import { getClientDb } from "./client";
import { COLLECTIONS } from "./collections";
import type { UserProfile, UserRole } from "@/types";

function mapUser(data: DocumentData, uid: string): UserProfile {
  return {
    uid,
    email: data.email ?? "",
    displayName: data.displayName ?? "",
    phone: data.phone,
    role: (data.role as UserRole) ?? "vendor",
    photoURL: data.photoURL,
    vendorId: data.vendorId,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getClientDb();
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  if (!snap.exists()) return null;
  return mapUser(snap.data(), uid);
}

export async function createUserProfile(input: {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  role?: UserRole;
}): Promise<UserProfile> {
  const db = getClientDb();
  const payload = {
    email: input.email,
    displayName: input.displayName,
    phone: input.phone ?? "",
    role: input.role ?? "vendor",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, COLLECTIONS.users, input.uid), payload, { merge: true });
  return mapUser(payload, input.uid);
}
