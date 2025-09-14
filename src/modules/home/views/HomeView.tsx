"use client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModal } from "@/modules/providers/ModalProvider";
import { ChatView } from "./ChatView";
import { trpc } from "@/trpc/client";
import { useSession } from "@/modules/providers/SessionProvider";
import { useActiveChatContext } from "@/modules/providers/ActiveChatProvider";

export function HomeView() {
  const isMobile = useIsMobile();
  const { openModal } = useModal();
  const [data] = trpc.home.getConversations.useSuspenseQuery();
  const { session } = useSession();
  const { setActiveChat } = useActiveChatContext();

  const [hasMounted, setHasMounted] = useState<boolean>(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || isMobile === undefined) {
    return null;
  }

  // TODO: Develop the Mobile View
  if (isMobile) {
    return <div></div>;
  }

  return (
    <div className="w-screen h-screen grid grid-cols-[20rem_1fr]">
      <div className="flex flex-col space-y-2 relative border-r border-r-foreground">
        <div className="h-20 p-4">
          <h1 className="text-4xl font-bold">WhatsApp</h1>
        </div>
        <div className="mx-2">
          <Input className="w-full text-base" placeholder="Search" />
        </div>
        <ScrollArea className="overflow-y-auto space-y-2">
          {/* No Chat Placeholder */}
          {data.length === 0 && null}
          {data.length > 0 &&
            data.map((item, index) => (
              <div
                key={index}
                className="text-xl font-semibold px-4 py-2 rounded-lg hover:bg-muted-foreground/90"
                onClick={() =>
                  setActiveChat(
                    item.members.filter(
                      (mem) => mem.id !== (session?.user.id as string),
                    )[0],
                  )
                }
              >
                {item.isGroup
                  ? item.name
                  : item.members.filter(
                      (mem) => mem.id !== (session?.user.id as string),
                    )[0].name}
              </div>
            ))}
        </ScrollArea>
        <Button
          size="lg"
          className="absolute bottom-4 right-4 z-10"
          onClick={() => openModal("addChat")}
        >
          <PlusIcon />
        </Button>
      </div>
      <div>
        <ChatView />
      </div>
    </div>
  );
}
