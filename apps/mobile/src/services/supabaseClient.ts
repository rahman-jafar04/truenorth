import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

const isPlaceholderConfig =
  !SUPABASE_URL ||
  SUPABASE_URL.includes("placeholder") ||
  !SUPABASE_ANON_KEY ||
  SUPABASE_ANON_KEY.includes("placeholder");

// Persistent storage adapter for Expo Web (localStorage) & Native (in-memory map)
const memoryStorage = new Map<string, string>();

function getLocalStorage(): any {
  try {
    if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage;
    }
  } catch {
    // Fallback
  }
  return null;
}

const storageAdapter = {
  getItem: (key: string): string | null => {
    const ls = getLocalStorage();
    if (ls) {
      try {
        return ls.getItem(key);
      } catch {
        // Fallback
      }
    }
    return memoryStorage.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.setItem(key, value);
      } catch {
        // Fallback
      }
    }
    memoryStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.removeItem(key);
      } catch {
        // Fallback
      }
    }
    memoryStorage.delete(key);
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export interface AuthSessionUser {
  id: string;
  email: string;
  displayName?: string;
  token: string;
}

/**
 * Service encapsulating Supabase Authentication flows with offline test fallbacks.
 */
export const supabaseAuthService = {
  isConfigured(): boolean {
    return !isPlaceholderConfig;
  },

  async signUp(
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ user: AuthSessionUser | null; error: Error | null }> {
    if (isPlaceholderConfig) {
      // Local development test fallback
      const mockId = "00000000-0000-0000-0000-000000000001";
      const mockUser: AuthSessionUser = {
        id: mockId,
        email,
        displayName: displayName || email.split("@")[0],
        token: `mock-token-${mockId}`
      };
      storageAdapter.setItem("truenorth-auth-session", JSON.stringify(mockUser));
      return { user: mockUser, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });

    if (error) {
      return { user: null, error: new Error(error.message) };
    }

    if (!data.user || !data.session) {
      return {
        user: null,
        error: new Error("Registration complete. Please verify your email to sign in.")
      };
    }

    const user: AuthSessionUser = {
      id: data.user.id,
      email: data.user.email!,
      displayName: displayName || (data.user.user_metadata?.display_name as string),
      token: data.session.access_token
    };

    return { user, error: null };
  },

  async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthSessionUser | null; error: Error | null }> {
    if (isPlaceholderConfig) {
      // Local development test fallback
      const mockId = "00000000-0000-0000-0000-000000000001";
      const mockUser: AuthSessionUser = {
        id: mockId,
        email,
        displayName: email.split("@")[0],
        token: `mock-token-${mockId}`
      };
      storageAdapter.setItem("truenorth-auth-session", JSON.stringify(mockUser));
      return { user: mockUser, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { user: null, error: new Error(error.message) };
    }

    if (!data.user || !data.session) {
      return { user: null, error: new Error("Authentication failed") };
    }

    const user: AuthSessionUser = {
      id: data.user.id,
      email: data.user.email!,
      displayName: data.user.user_metadata?.display_name as string | undefined,
      token: data.session.access_token
    };

    return { user, error: null };
  },

  async signOut(): Promise<void> {
    storageAdapter.removeItem("truenorth-auth-session");
    if (!isPlaceholderConfig) {
      await supabase.auth.signOut().catch(() => {});
    }
  },

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    if (isPlaceholderConfig) {
      return { error: null };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  },

  async getStoredSession(): Promise<AuthSessionUser | null> {
    const raw = storageAdapter.getItem("truenorth-auth-session");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Fallback
      }
    }

    if (!isPlaceholderConfig) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        return {
          id: data.session.user.id,
          email: data.session.user.email!,
          displayName: data.session.user.user_metadata?.display_name as string | undefined,
          token: data.session.access_token
        };
      }
    } else {
      // In local development with placeholder Supabase credentials, auto-initialize demo session
      const defaultDevUser: AuthSessionUser = {
        id: "00000000-0000-0000-0000-000000000001",
        email: "demo@truenorth.app",
        displayName: "Demo Explorer",
        token: "mock-token-00000000-0000-0000-0000-000000000001"
      };
      storageAdapter.setItem("truenorth-auth-session", JSON.stringify(defaultDevUser));
      return defaultDevUser;
    }

    return null;
  }
};
