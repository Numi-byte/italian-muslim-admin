// src/auth/AuthProvider.tsx
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabaseClient";
import { AuthContext, type AuthContextValue, type Profile } from "./authContext";
import { loadProfile } from "./loadProfile";

const SUPER_ADMIN_USER_ID = "e4d243f9-9b01-42d4-8dec-f1826bfe74ca"; // <-- you
const PRAYER_TIMING_EDITOR_USER_ID = "24dcca75-577b-4d7d-8177-5932e85170e7";
const PRAYER_TIMING_EDITOR_MASJID_ID =
  "4be0c02c-0b29-4c28-8547-f449b49bd619";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const authRequestId = useRef(0);
  const isMountedRef = useRef(false);

  const applySession = useCallback(async (nextSession: Session | null) => {
    const requestId = authRequestId.current + 1;
    authRequestId.current = requestId;

    if (!isMountedRef.current) return;
    setLoading(true);

    const nextUser = nextSession?.user ?? null;
    setSession(nextSession);
    setUser(nextUser);

    if (!nextUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const nextProfile = await loadProfile(nextUser.id);
      if (isMountedRef.current && authRequestId.current === requestId) {
        setProfile(nextProfile);
      }
    } catch (e) {
      console.error("[Auth] loadProfile error:", e);
      if (isMountedRef.current && authRequestId.current === requestId) {
        setProfile({ id: nextUser.id, role: null });
      }
    } finally {
      if (isMountedRef.current && authRequestId.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    isMountedRef.current = true;

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMounted) return;
        console.log("[Auth] onAuthStateChange:", _event);
        window.setTimeout(() => {
          if (isMountedRef.current) void applySession(nextSession ?? null);
        }, 0);
      }
    );

    (async () => {
      try {
        console.log("[Auth] background getSession()");
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("[Auth] getSession error:", error);

        if (!isMounted) return;
        await applySession(data?.session ?? null);
      } catch (e) {
        console.error("[Auth] unexpected getSession error:", e);
        if (isMounted) setLoading(false);
      } finally {
        if (isMounted && authRequestId.current === 0) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      isMountedRef.current = false;
      listener.subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[Auth] signIn error:", error);
      return { error: error.message };
    }

    return {};
  };

  const signOut: AuthContextValue["signOut"] = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  // Hard override: your user id is always admin
  const isAdmin =
    profile?.role === "super_admin" || user?.id === SUPER_ADMIN_USER_ID;
  const isPrayerTimingEditor = user?.id === PRAYER_TIMING_EDITOR_USER_ID;
  const accessiblePrayerMasjidIds = isPrayerTimingEditor
    ? [PRAYER_TIMING_EDITOR_MASJID_ID]
    : [];

  const value: AuthContextValue = {
    loading,
    session,
    user,
    profile,
    isAdmin,
    isPrayerTimingEditor,
    accessiblePrayerMasjidIds,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
