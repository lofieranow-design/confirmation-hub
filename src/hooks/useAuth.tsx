import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Agent = Tables<"agents">;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  agent: Agent | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; isAdmin: boolean | null; isApproved: boolean | null }>;
  signUp: (email: string, password: string, name: string, suffixCode: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const hydratedUserIdRef = useRef<string | null>(null);
  const hydrationRequestIdRef = useRef(0);

  const fetchAgent = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }, []);

  const fetchRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (error) throw error;
    return !!data;
  }, []);

  const clearAuthState = useCallback(() => {
    hydrationRequestIdRef.current += 1;
    hydratedUserIdRef.current = null;
    setAgent(null);
    setIsAdmin(false);
    setLoading(false);
  }, []);

  const hydrateUserState = useCallback(
    async (nextUser: User, force = false) => {
      if (!force && hydratedUserIdRef.current === nextUser.id) {
        setLoading(false);
        return;
      }

      const requestId = ++hydrationRequestIdRef.current;
      setLoading(true);

      try {
        const [agentData, isAdminData] = await Promise.all([
          fetchAgent(nextUser.id),
          fetchRole(nextUser.id),
        ]);

        if (hydrationRequestIdRef.current !== requestId) return;

        hydratedUserIdRef.current = nextUser.id;
        setAgent(agentData);
        setIsAdmin(isAdminData);
      } catch (error) {
        if (hydrationRequestIdRef.current !== requestId) return;

        hydratedUserIdRef.current = null;
        setAgent(null);
        setIsAdmin(false);
        console.error("Failed to hydrate auth state", error);
      } finally {
        if (hydrationRequestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [fetchAgent, fetchRole]
  );

  useEffect(() => {
    const syncSession = (nextSession: Session | null, force = false) => {
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        clearAuthState();
        return;
      }

      void hydrateUserState(nextUser, force);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        syncSession(nextSession, event === "SIGNED_IN" || event === "USER_UPDATED");
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session);
    });

    return () => subscription.unsubscribe();
  }, [clearAuthState, hydrateUserState]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      return { error: new Error(error.message), isAdmin: null };
    }

    const signedInUser = data.user ?? data.session?.user;

    if (!signedInUser) {
      setLoading(false);
      return { error: new Error("Impossible de récupérer le compte connecté."), isAdmin: null };
    }

    try {
      const isAdminUser = await fetchRole(signedInUser.id);

      // For non-admin users, check approval status
      if (!isAdminUser) {
        const agentData = await fetchAgent(signedInUser.id);
        if (!agentData?.is_approved) {
          // Sign out immediately - not approved
          await supabase.auth.signOut();
          setLoading(false);
          return {
            error: new Error("Votre compte est en attente d'approbation par l'administrateur."),
            isAdmin: false,
            isApproved: false,
          };
        }
      }

      return { error: null, isAdmin: isAdminUser, isApproved: true };
    } catch (roleError) {
      setLoading(false);
      return {
        error: roleError instanceof Error ? roleError : new Error("Impossible de vérifier le rôle du compte."),
        isAdmin: null,
        isApproved: null,
      };
    }
  };

  const signUp = async (email: string, password: string, name: string, suffixCode: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, suffix_code: suffixCode },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, agent, isAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
