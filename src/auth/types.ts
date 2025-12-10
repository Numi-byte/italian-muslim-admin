// src/auth/types.ts
import type { Session, User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  role: string | null;
};

export type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};
