// src/auth/AuthProvider.tsx
import { useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabaseClient";
import { AuthContext, type AuthContextValue, type Profile } from "./authContext";
import { loadProfile } from "./loadProfile";

const SUPER_ADMIN_USER_ID = "e4d243f9-9b01-42d4-8dec-f1826bfe74ca"; // <-- you

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let isMounted = true;

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!isMounted) return;
        console.log("[Auth] onAuthStateChange:", _event);

        const s = nextSession ?? null;
        const u = s?.user ?? null;

        setSession(s);
        setUser(u);

        if (u) {
          try {
            const p = await loadProfile(u.id);
            if (isMounted) setProfile(p);
          } catch (e) {
            console.error("[Auth] loadProfile error (listener):", e);
            if (isMounted) setProfile({ id: u.id, role: null });
          }
        } else {
          setProfile(null);
        }
      }
    );

    (async () => {
      try {
        console.log("[Auth] background getSession()");
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("[Auth] getSession error:", error);

        if (!isMounted) return;
        const s = data?.session ?? null;
        const u = s?.user ?? null;
        setSession(s);
        setUser(u);

        if (u) {
          try {
            const p = await loadProfile(u.id);
            if (isMounted) setProfile(p);
          } catch (e) {
            console.error("[Auth] loadProfile error (init):", e);
            if (isMounted) setProfile({ id: u.id, role: null });
          }
        }
      } catch (e) {
        console.error("[Auth] unexpected getSession error:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

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

  const value: AuthContextValue = {
    loading,
    session,
    user,
    profile,
    isAdmin,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
