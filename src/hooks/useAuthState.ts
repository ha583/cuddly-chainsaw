import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";


interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuthState = (): AuthState => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    // Check session on mount
    checkSession();

    // Listen for auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.subscription?.unsubscribe();
    };
  }, []);

  return { isAuthenticated, isLoading };
};