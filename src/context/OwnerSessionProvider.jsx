import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { OwnerSessionContext } from "./ownerSessionContext";

const OWNER_EMAIL = "notes-owner@liangos.local";

function OwnerSessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return undefined;

    let isActive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isActive) return;
      setSession(data.session);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isActive) return;
      setSession(nextSession);
      setIsReady(true);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (password) => {
    if (!supabase) return { error: new Error("Supabase is unavailable.") };

    return supabase.auth.signInWithPassword({
      email: OWNER_EMAIL,
      password,
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      isAvailable: Boolean(supabase),
      isReady,
      session,
      signIn,
      signOut,
      user: session?.user ?? null,
    }),
    [isReady, session, signIn, signOut],
  );

  return <OwnerSessionContext.Provider value={value}>{children}</OwnerSessionContext.Provider>;
}

export default OwnerSessionProvider;
