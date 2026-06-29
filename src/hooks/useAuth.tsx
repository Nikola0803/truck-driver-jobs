import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { db, type LocalUser } from "@/lib/db";

// Re-export LocalUser as User so any code that imports `User` keeps working
export type User = LocalUser;

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  has_cdl: boolean;
  cdl_state: string | null;
  experience: string | null;
  endorsement_type: string | null;
  driver_type: string | null;
  preferred_route: string | null;
  preferred_equipment: string | null;
  home_time_preference: string | null;
  min_pay_expectation: string | null;
  is_admin: boolean;
  updated_at: string | null;
  created_at: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, profileData: Partial<Profile>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) {
      setProfile({
        ...data,
        is_admin: !!data.is_admin,
        has_cdl: !!data.has_cdl,
      } as Profile);
    }
  };

  useEffect(() => {
    // Check stored session on mount — await profile before releasing loading
    db.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes (sign-in after redirect)
    const { data: listener } = db.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) return { error: new Error(error.message) };
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    profileData: Partial<Profile>
  ): Promise<{ error: Error | null }> => {
    const { data, error } = await db.auth.signUp({
      email,
      password,
      ...profileData,
    });
    if (error) return { error: new Error(error.message) };
    if (data?.user) {
      await fetchProfile(data.user.id);
    }
    return { error: null };
  };

  const signOut = async () => {
    await db.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  // Use profile if loaded, fall back to is_admin embedded in the stored user object
  const isAdmin = profile?.is_admin ?? user?.is_admin ?? false;

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
