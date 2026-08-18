import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OwnerSessionContext } from "./ownerSessionContext";

const OWNER_EMAIL = "notes-owner@liangos.local";
const HAS_SUPABASE_CONFIG = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);
const SESSION_RESTORE_TIMEOUT = 8000;
const SIGN_IN_TIMEOUT = 12000;

function withTimeout(promise, timeout, message) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeout);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function OwnerSessionProvider({ children }) {
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [isAvailable, setIsAvailable] = useState(HAS_SUPABASE_CONFIG);
  const [isReady, setIsReady] = useState(!HAS_SUPABASE_CONFIG);
  const clientRef = useRef(null);
  const loadPromiseRef = useRef(null);
  const subscriptionRef = useRef(null);
  const isMountedRef = useRef(true);

  const ensureClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;
    if (loadPromiseRef.current) return loadPromiseRef.current;
    if (!HAS_SUPABASE_CONFIG) return null;

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
          const { data, error } = await withTimeout(
            supabase.auth.getSession(),
            SESSION_RESTORE_TIMEOUT,
            "Session restore timed out.",
          );
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
    if (!HAS_SUPABASE_CONFIG) return undefined;

    const beginRestore = () => void ensureClient();
    const idleId = window.requestIdleCallback?.(beginRestore, { timeout: 2200 });
    const timeoutId = idleId === undefined ? window.setTimeout(beginRestore, 900) : null;

    return () => {
      isMountedRef.current = false;
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [ensureClient]);

  const signIn = useCallback(async (password) => {
    const supabase = await ensureClient();
    if (!supabase) return { error: new Error("Supabase is unavailable.") };

    try {
      return await withTimeout(
        supabase.auth.signInWithPassword({
          email: OWNER_EMAIL,
          password,
        }),
        SIGN_IN_TIMEOUT,
        "Sign in timed out.",
      );
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Unable to sign in."),
      };
    }
  }, [ensureClient]);

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

  return <OwnerSessionContext.Provider value={value}>{children}</OwnerSessionContext.Provider>;
}

export default OwnerSessionProvider;
