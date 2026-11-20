import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { AuthUser } from '../types';
import { api } from '../lib/api';

interface SessionValue {
  user: AuthUser | null;
  signIn: (correo: string, contrasena: string) => Promise<void>;
  signOut: () => void;
}

const SessionContext = createContext<SessionValue | undefined>(undefined);

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      signIn: async (correo, contrasena) => {
        const authenticatedUser = await api.login(correo.trim(), contrasena);
        setUser(authenticatedUser);
      },
      signOut: () => setUser(null),
    }),
    [user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession debe usarse dentro de SessionProvider.');
  return value;
}
