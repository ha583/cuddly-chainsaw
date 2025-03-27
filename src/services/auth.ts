
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Session, User } from "@supabase/supabase-js";

export interface AuthError {
  message: string;
}

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<{
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
      return { user: null, session: null, error };
    }

    toast({
      title: "Welcome back!",
      description: "You have been successfully signed in.",
    });

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    const authError = error as AuthError;
    toast({
      title: "Error signing in",
      description: authError.message || "An unexpected error occurred",
      variant: "destructive",
    });
    return { user: null, session: null, error: authError };
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, name: string): Promise<{
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
      return { user: null, session: null, error };
    }

    if (data.session === null) {
      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account.",
      });
    } else {
      toast({
        title: "Account created",
        description: "Your account has been successfully created.",
      });
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    const authError = error as AuthError;
    toast({
      title: "Error signing up",
      description: authError.message || "An unexpected error occurred",
      variant: "destructive",
    });
    return { user: null, session: null, error: authError };
  }
};

// Sign out
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }

    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });

    return { error: null };
  } catch (error) {
    const authError = error as AuthError;
    toast({
      title: "Error signing out",
      description: authError.message || "An unexpected error occurred",
      variant: "destructive",
    });
    return { error: authError };
  }
};

// Get current session
export const getCurrentSession = async (): Promise<{
  session: Session | null;
  error: AuthError | null;
}> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return { session: null, error };
    }

    return { session: data.session, error: null };
  } catch (error) {
    const authError = error as AuthError;
    return { session: null, error: authError };
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      toast({
        title: "Error resetting password",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }

    toast({
      title: "Password reset email sent",
      description: "Check your email for a link to reset your password.",
    });

    return { error: null };
  } catch (error) {
    const authError = error as AuthError;
    toast({
      title: "Error resetting password",
      description: authError.message || "An unexpected error occurred",
      variant: "destructive",
    });
    return { error: authError };
  }
};
// ...existing code...

// Sign in with social provider (OAuth)
export const signInWithProvider = async (provider: 'google' | 'github'): Promise<{
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast({
        title: `Error signing in with ${provider}`,
        description: error.message,
        variant: "destructive",
      });
      return { user: null, session: null, error };
    }

    // For OAuth providers, this initiates the flow but doesn't return user/session directly
    // The user will be redirected to the provider's authentication page
    // No toast here as the page will redirect away
    
    return { user: null, session: null, error: null };
  } catch (error) {
    const authError = error as AuthError;
    toast({
      title: `Error signing in with ${provider}`,
      description: authError.message || "An unexpected error occurred",
      variant: "destructive",
    });
    return { user: null, session: null, error: authError };
  }
};