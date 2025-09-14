"use client";
import { authClient, type Session } from "@/lib/auth-client";
import {
  useContext,
  createContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface SessionContextProps {
  session: Session | null;
  setSession: (session: Session) => void;
}

const SessionContext = createContext<SessionContextProps | undefined>(
  undefined,
);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    async function getSession() {
      const userSession = await authClient.getSession();
      setSession(userSession.data);
    }
    getSession();
  }, []);

  return (
    <SessionContext.Provider value={{ session, setSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used in a SessionProvider");
  }
  return context;
}
