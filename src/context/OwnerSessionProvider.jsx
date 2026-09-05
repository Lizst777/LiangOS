import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  hasSupabaseConfig,
  restoreOwnerSession,
  signInOwner,
} from "../features/auth/ownerAuth";
import { OwnerSessionContext } from "./ownerSessionContext";

function OwnerSessionProvider({ children }) {
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [isAvailable, setIsAvailable] = useState(hasSupabaseConfig);
  const [isReady, setIsReady] = useState(!hasSupabaseConfig);
  const clientRef = useRef(null);
  const loadPromiseRef = useRef(null);
  const subscriptionRef = useRef(null);
  const isMountedRef = useRef(true);

  const ensureClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;
    if (loadPromiseRef.current) return loadPromiseRef.current;
    if (!hasSupabaseConfig) return null;

    setIsReady(false);
    loadPromiseRef.current = (async () => {
      try {
        const { supabase } = await import("../lib/supabase");
        if (!supabase) throw new Error("Supabase is unavailable.");

        clientRef.current = supabase;
        if (isMountedRef.current) {
          setClient(supabase);
          setIsAvailable(true);
        }

        if (!subscriptionRef.current) {
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            if (!isMountedRef.current) return;
            setSession(nextSession);
            setIsReady(true);
          });
          subscriptionRef.current = subscription;
        }

        try {
          const { data, error } = await restoreOwnerSession(supabase);
          if (error) {
            void supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
          }
          if (isMountedRef.current) setSession(error ? null : data.session);
        } catch {
          if (isMountedRef.current) setSession(null);
        }

        return supabase;
      } catch {
        loadPromiseRef.current = null;
        if (isMountedRef.current) {
          setSession(null);
          setIsAvailable(false);
        }
        return null;
      } finally {
        if (isMountedRef.current) setIsReady(true);
      }
    })();

    return loadPromiseRef.current;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (!hasSupabaseConfig) return undefined;

    const beginRestore = () => void ensureClient();
    const idleId = window.requestIdleCallback?.(beginRestore, { timeout: 2200 });
    const timeoutId =
      idleId === undefined ? window.setTimeout(beginRestore, 900) : null;

    return () => {
      isMountedRef.current = false;
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [ensureClient]);

  const signIn = useCallback(
    async (password) => {
      const supabase = await ensureClient();
      if (!supabase) return { error: new Error("Supabase is unavailable.") };

      try {
        return await signInOwner(supabase, password);
      } catch (error) {
        return {
          error: error instanceof Error ? error : new Error("Unable to sign in."),
        };
      }
    },
    [ensureClient],
  );

  const signOut = useCallback(async () => {
    const supabase = clientRef.current;
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      client,
      ensureClient,
      isAvailable,
      isReady,
      session,
      signIn,
      signOut,
      user: session?.user ?? null,
    }),
    [client, ensureClient, isAvailable, isReady, session, signIn, signOut],
  );

  return (
    <OwnerSessionContext.Provider value={value}>
      {children}
    </OwnerSessionContext.Provider>
  );
}

export default OwnerSessionProvider;
