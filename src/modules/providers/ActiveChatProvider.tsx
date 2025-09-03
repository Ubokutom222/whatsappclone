"use client";
import { useContext, createContext, useState, ReactNode } from "react";

type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null | undefined;
} | null;

interface ActiveChatContextProp {
  activeChat: User;
  setActiveChat: (user: User) => void;
}

const ActiveChatContext = createContext<ActiveChatContextProp | undefined>(
  undefined,
);

export function ActiveChatContextProivder({
  children,
}: {
  children: ReactNode;
}) {
  const [activeChat, setActiveChat] = useState<User>(null);

  return (
    <ActiveChatContext.Provider value={{ activeChat, setActiveChat }}>
      {children}
    </ActiveChatContext.Provider>
  );
}

export function useActiveChatContext() {
  const context = useContext(ActiveChatContext);
  if (!context) {
    throw new Error("useActiveChatContext must be used within a Provider");
  }
  return context;
}
