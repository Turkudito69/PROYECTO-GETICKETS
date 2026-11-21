import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '../types';
import { api } from '../lib/api';

interface SessionValue {
  user: AuthUser | null;
  isReady: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  updateUser: (user: AuthUser) => void;
  signIn: (correo: string, contrasena: string) => Promise<void>;
  signOut: () => void;
}

const SESSION_KEY = 'getickets_session_user';
const THEME_KEY = 'getickets_dark_mode';
const SessionContext = createContext<SessionValue | undefined>(undefined);

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([AsyncStorage.getItem(SESSION_KEY), AsyncStorage.getItem(THEME_KEY)])
      .then(([savedUser, savedTheme]) => {
        if (!active) return;
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser) as AuthUser);
          } catch {
            void AsyncStorage.removeItem(SESSION_KEY).catch(() => undefined);
          }
        }
        setDarkMode(savedTheme === 'true');
      })
      .catch(() => undefined)
      .finally(() => { if (active) setIsReady(true); });
    return () => { active = false; };
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      isReady,
      darkMode,
      toggleDarkMode: () => {
        const next = !darkMode;
        setDarkMode(next);
        void AsyncStorage.setItem(THEME_KEY, String(next)).catch(() => undefined);
      },
      updateUser: (nextUser) => {
        setUser(nextUser);
        void AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextUser)).catch(() => undefined);
      },
      signIn: async (correo, contrasena) => {
        const authenticatedUser = await api.login(correo.trim(), contrasena);
        setUser(authenticatedUser);
        void AsyncStorage.setItem(SESSION_KEY, JSON.stringify(authenticatedUser)).catch(() => undefined);
      },
      signOut: () => {
        setUser(null);
        void AsyncStorage.removeItem(SESSION_KEY).catch(() => undefined);
      },
    }),
    [darkMode, isReady, user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession debe usarse dentro de SessionProvider.');
  return value;
}
