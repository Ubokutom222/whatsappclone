"use client";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/trpc/client";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActiveChatContext } from "@/modules/providers/ActiveChatProvider";
import { useModal } from "@/modules/providers/ModalProvider";
import { useSession } from "@/modules/providers/SessionProvider";

export function AddChatModal() {
  const [data] = trpc.home.getUsers.useSuspenseQuery();
  const { setActiveChat } = useActiveChatContext();
  const { closeModal } = useModal();
  const { session } = useSession();

  const otherUsers = data.filter((user) => user.id !== session?.user.id);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add A New Chat</DialogTitle>
      </DialogHeader>
      <Command>
        <CommandInput placeholder="Search Contact..." />
        <ScrollArea>
          <CommandList>
            {otherUsers.map((user, index) => (
              <CommandItem
                key={index}
                onSelect={async () => {
                  setActiveChat(user);
                  closeModal();
                }}
              >
                {user.name}
              </CommandItem>
            ))}
          </CommandList>
        </ScrollArea>
      </Command>
    </DialogContent>
  );
}
