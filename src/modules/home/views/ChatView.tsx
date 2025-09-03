"use client";
import { useActiveChatContext } from "@/modules/providers/ActiveChatProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Paperclip } from "lucide-react";
export function ChatView() {
  const { activeChat } = useActiveChatContext();

  if (!activeChat || activeChat === null) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <span className="text-muted-foreground/40 text-2xl">
          No Chat Selected
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="h-16 flex items-center px-6 w-full">
        <h4 className="text-lg font-semibold">{activeChat.name}</h4>
      </div>
      <div className="flex-1"></div>
      <div className="h-12 w-full flex flex-row space-x-4 px-4">
        <Button size="lg">
          <Paperclip />
        </Button>
        <Input className="w-full flex-1" placeholder="Type A Message..." />
        <Button size="lg">
          <Mic />
        </Button>
      </div>
    </div>
  );
}
