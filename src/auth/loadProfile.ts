// src/auth/loadProfile.ts
import { supabase } from "../lib/supabaseClient";
import type { Profile } from "./authContext";

export const loadProfile = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("[Auth] loadProfile error:", error);
    return { id: userId, role: null };
  }

  return data as Profile;
};
