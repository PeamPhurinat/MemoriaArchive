import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  assertSupabaseConfigured,
  isSupabaseConfigured,
  supabase
} from "../lib/supabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthError(
        "Supabase auth is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY."
      );
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const initializeSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (error) {
        setAuthError(error.message || "Failed to load session.");
      }

      setSession(data?.session || null);
      setUser(data?.session?.user || null);
      setLoading(false);
    };

    initializeSession();

    const { data: subscriptionData } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;
      if (event === "SIGNED_OUT") {
        setAuthError("");
      }
      setSession(nextSession || null);
      setUser(nextSession?.user || null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscriptionData?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    assertSupabaseConfigured();
    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message || "Failed to sign in.");
    }

    return data;
  }, []);

  const signUp = useCallback(async ({ email, password }) => {
    assertSupabaseConfigured();
    setAuthError("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      throw new Error(error.message || "Failed to sign up.");
    }

    return data;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      loading,
      user,
      session,
      authError,
      isAuthenticated: Boolean(user),
      signIn,
      signUp,
      signOut
    }),
    [authError, loading, session, signIn, signOut, signUp, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
};
