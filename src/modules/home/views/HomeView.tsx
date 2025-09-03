"use client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModal } from "@/modules/providers/ModalProvider";
import { ChatView } from "./ChatView";

export function HomeView() {
  const isMobile = useIsMobile();
  const { openModal } = useModal();

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
        <ScrollArea className="overflow-y-auto">
          {/* No Chat Placeholder */}
          <div className="size-full flex items-center justify-center text-muted-foreground">
            No Chat Available
          </div>
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
