import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser, Organization } from '@/lib/api';

interface AuthState {
  user: AuthUser | null;
  organizations: Organization[] | null;
}

interface AuthContextType extends AuthState {
  login: (user: AuthUser, organizations: Organization[]) => void;
  logout: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  updateOrganization: (orgId: string, partial: Partial<Organization>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'auth_data';

function loadFromStorage(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        user: parsed.user ?? null,
        organizations: parsed.organizations ?? null,
      };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return { user: null, organizations: null };
}

function saveToStorage(state: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(loadFromStorage);

  useEffect(() => {
    saveToStorage(authState);
  }, [authState]);

  const login = (user: AuthUser, organizations: Organization[]) => {
    setAuthState({ user, organizations });
  };

  const logout = () => {
    setAuthState({ user: null, organizations: null });
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUser = (partial: Partial<AuthUser>) => {
    setAuthState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...partial } : null,
    }));
  };

  const updateOrganization = (orgId: string, partial: Partial<Organization>) => {
    setAuthState((prev) => ({
      ...prev,
      organizations: prev.organizations
        ? prev.organizations.map((org) =>
            org.id === orgId ? { ...org, ...partial } : org
          )
        : null,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        updateUser,
        updateOrganization,
        isAuthenticated: !!authState.user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
