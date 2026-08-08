"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { createUserProfile, getUserProfile } from "@/lib/firebase/users";
import { getVendorByOwner } from "@/lib/firebase/vendors";
import type { UserProfile, Vendor } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  vendor: Vendor | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshVendor: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSecondary = useCallback(async (uid: string, userHint?: User | null) => {
    let p = await getUserProfile(uid);
    // If Auth succeeded earlier but Firestore rules blocked profile create, heal on next load
    if (!p && userHint) {
      try {
        p = await createUserProfile({
          uid,
          email: userHint.email || "",
          displayName: userHint.displayName || userHint.email || "Vendor",
          role: "vendor",
        });
      } catch (e) {
        console.error("[auth] could not create missing profile — publish firestore.rules", e);
      }
    }
    setProfile(p);
    if (p?.vendorId || p?.role === "vendor") {
      const v = await getVendorByOwner(uid);
      setVendor(v);
    } else {
      setVendor(null);
    }
  }, []);

  useEffect(() => {
    let unsub = () => {};
    try {
      const auth = getClientAuth();
      unsub = onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          try {
            await loadSecondary(u.uid, u);
          } catch (e) {
            console.error("Failed loading profile", e);
          }
        } else {
          setProfile(null);
          setVendor(null);
        }
        setLoading(false);
      });
    } catch (e) {
      console.error("Auth init failed", e);
      void Promise.resolve().then(() => setLoading(false));
    }
    return () => unsub();
  }, [loadSecondary]);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getClientAuth();
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      displayName: string;
      phone?: string;
    }) => {
      const auth = getClientAuth();
      const cred = await createUserWithEmailAndPassword(
        auth,
        input.email,
        input.password
      );
      try {
        await updateProfile(cred.user, { displayName: input.displayName });
      } catch (e) {
        console.warn("[signUp] updateProfile failed (non-fatal)", e);
      }
      try {
        await createUserProfile({
          uid: cred.user.uid,
          email: input.email,
          displayName: input.displayName,
          phone: input.phone,
          role: "vendor",
        });
      } catch (e) {
        // Auth user exists — surface Firestore/rules problems clearly
        console.error("[signUp] createUserProfile failed", e);
        throw e;
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    const auth = getClientAuth();
    await firebaseSignOut(auth);
    setProfile(null);
    setVendor(null);
  }, []);

  const refreshVendor = useCallback(async () => {
    if (!user) return;
    const v = await getVendorByOwner(user.uid);
    setVendor(v);
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await loadSecondary(user.uid, user);
  }, [user, loadSecondary]);

  const value = useMemo(
    () => ({
      user,
      profile,
      vendor,
      loading,
      signIn,
      signUp,
      signOut,
      refreshVendor,
      refreshProfile,
    }),
    [
      user,
      profile,
      vendor,
      loading,
      signIn,
      signUp,
      signOut,
      refreshVendor,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
