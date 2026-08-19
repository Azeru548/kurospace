"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { getVendorById, getVendorByOwner } from "@/lib/firebase/vendors";
import type { UserProfile, Vendor } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  vendor: Vendor | null;
  /** True until Firebase Auth + profile/vendor have been resolved for the current session. */
  loading: boolean;
  /** Set when profile/vendor fetch fails — do not treat as "needs onboarding". */
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);
  const loadGen = useRef(0);

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

    let v: Vendor | null = null;
    if (p?.vendorId) {
      v = await getVendorById(p.vendorId);
    }
    if (!v && (p?.vendorId || p?.role === "vendor")) {
      v = await getVendorByOwner(uid);
    }

    return { profile: p, vendor: v };
  }, []);

  useEffect(() => {
    let unsub = () => {};
    try {
      const auth = getClientAuth();
      unsub = onAuthStateChanged(auth, async (u) => {
        // Stay in the loading state until profile + vendor are resolved.
        // Otherwise dashboard treats "signed in, vendor still null" as onboarding
        // and ping-pongs with /onboarding once the vendor arrives.
        const gen = ++loadGen.current;
        setLoading(true);
        setError(null);
        setUser(u);
        if (u) {
          try {
            const secondary = await loadSecondary(u.uid, u);
            if (gen !== loadGen.current) return;
            setProfile(secondary.profile);
            setVendor(secondary.vendor);
          } catch (e) {
            console.error("Failed loading profile", e);
            if (gen !== loadGen.current) return;
            setProfile(null);
            setVendor(null);
            setError(
              e instanceof Error
                ? e.message
                : "Could not load your workspace. Check your connection and try again."
            );
          }
        } else {
          setProfile(null);
          setVendor(null);
        }
        if (gen === loadGen.current) setLoading(false);
      });
    } catch (e) {
      console.error("Auth init failed", e);
      void Promise.resolve().then(() => {
        setLoading(false);
        setError("Auth failed to initialize. Check Firebase configuration.");
      });
    }
    return () => {
      loadGen.current += 1;
      unsub();
    };
  }, [loadSecondary]);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getClientAuth();
    // Synchronously mark session as unresolved so a post-login /dashboard
    // navigation cannot redirect to onboarding before vendor is fetched.
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      if (!auth.currentUser) setLoading(false);
      throw e;
    }
  }, []);

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      displayName: string;
      phone?: string;
    }) => {
      const auth = getClientAuth();
      setLoading(true);
      setError(null);
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(
          auth,
          input.email,
          input.password
        );
      } catch (e) {
        if (!auth.currentUser) setLoading(false);
        throw e;
      }
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
        setLoading(false);
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
    const v = profile?.vendorId
      ? (await getVendorById(profile.vendorId)) ?? (await getVendorByOwner(user.uid))
      : await getVendorByOwner(user.uid);
    setVendor(v);
  }, [user, profile?.vendorId]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const gen = ++loadGen.current;
    setLoading(true);
    setError(null);
    try {
      const secondary = await loadSecondary(user.uid, user);
      if (gen !== loadGen.current) return;
      setProfile(secondary.profile);
      setVendor(secondary.vendor);
    } catch (e) {
      console.error("Failed refreshing profile", e);
      if (gen !== loadGen.current) return;
      setError(
        e instanceof Error
          ? e.message
          : "Could not load your workspace. Check your connection and try again."
      );
    } finally {
      if (gen === loadGen.current) setLoading(false);
    }
  }, [user, loadSecondary]);

  const value = useMemo(
    () => ({
      user,
      profile,
      vendor,
      loading,
      error,
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
      error,
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
