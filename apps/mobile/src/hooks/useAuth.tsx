import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from "react";
import { UserProfile, UpdateProfileInput } from "@truenorth/shared";
import { supabaseAuthService, AuthSessionUser } from "../services/supabaseClient";
import { apiClient } from "../services/apiClient";

interface AuthContextValue {
  user: AuthSessionUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, pass: string) => Promise<boolean>;
  signUp: (email: string, pass: string, displayName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (token: string, currentUser: AuthSessionUser) => {
    try {
      apiClient.setAuthToken(token);
      const res = await apiClient.getProfile();
      setProfile(res.data);
    } catch {
      // If profile doesn't exist yet, try sync
      try {
        const syncRes = await apiClient.syncUser(currentUser.displayName);
        setProfile(syncRes.data);
      } catch (e) {
        console.warn("Failed to fetch or sync profile", e);
      }
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const stored = await supabaseAuthService.getStoredSession();
        if (stored) {
          setUser(stored);
          apiClient.setAuthToken(stored.token);
          await fetchProfile(stored.token, stored);
        }
      } catch (err) {
        console.error("Auth initialization failed", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [fetchProfile]);

  const signIn = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { user: authUser, error: authError } = await supabaseAuthService.signIn(email, pass);
      if (authError || !authUser) {
        setError(authError?.message || "Sign in failed");
        return false;
      }

      setUser(authUser);
      apiClient.setAuthToken(authUser.token);
      await fetchProfile(authUser.token, authUser);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    displayName?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { user: authUser, error: authError } = await supabaseAuthService.signUp(
        email,
        pass,
        displayName
      );
      if (authError || !authUser) {
        setError(authError?.message || "Registration failed");
        return false;
      }

      setUser(authUser);
      apiClient.setAuthToken(authUser.token);
      await fetchProfile(authUser.token, authUser);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await supabaseAuthService.signOut();
      apiClient.setAuthToken(null);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (input: UpdateProfileInput): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.updateProfile(input);
      setProfile(res.data);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await fetchProfile(user.token, user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
