"use client";
import { useContext, createContext, useState, ReactNode } from "react";
import { InferSelectModel } from "drizzle-orm";
import { user, conversations } from "@/db/schema";

type Chat =
  | InferSelectModel<typeof conversations>
  | InferSelectModel<typeof user>
  | null;

interface ActiveChatContextProp {
  activeChat: Chat;
  setActiveChat: (user: Chat) => void;
}

const ActiveChatContext = createContext<ActiveChatContextProp | undefined>(
  undefined,
);

export function ActiveChatContextProivder({
  children,
}: {
  children: ReactNode;
}) {
  const [activeChat, setActiveChat] = useState<Chat>(null);

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
