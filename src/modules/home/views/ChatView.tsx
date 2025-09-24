"use client";
import { useActiveChatContext } from "@/modules/providers/ActiveChatProvider";
import { useSession } from "@/modules/providers/SessionProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// import { InferSelectModel } from "drizzle-orm";
// import { messages as messageSchema } from "@/db/schema"
import { ScrollArea } from "@/components/ui/scroll-area";
import pusherClient from "@/lib/pusher-client";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

type RouterOutput = inferRouterOutputs<AppRouter>;
type MessagesPage = RouterOutput["home"]["getMessages"];
type Message = MessagesPage["messages"][number];

const schema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty"),
});
export function ChatView() {
  const { activeChat } = useActiveChatContext();
  const { session } = useSession();
  const selfId = session?.user.id;
  const { setValue, handleSubmit, resetField, register, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      content: "",
    },
  });
  const mutation = trpc.home.sendMessage.useMutation({
    onError({ message }) {
      toast.error(message);
    },
    onSuccess() {
      toast.success("Message Sent Successfully");
      resetField("content");
    },
  });
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    trpc.home.getMessages.useInfiniteQuery(
      {
        conversationId:
          activeChat && "isGroup" in activeChat ? activeChat.id : "",
        limit: 20,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: !!activeChat,
      },
    );
  const messages = data?.pages.flatMap((page) => page.messages) ?? [];
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!activeChat) return;

    const channel = pusherClient.subscribe(`conversation-${activeChat.id}`);

    channel.bind("new-message", (message: Message) => {
      // Optimistically add new message to TRPC cache
      utils.home.getMessages.setInfiniteData(
        { conversationId: activeChat.id, limit: 20 },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: [
              {
                ...oldData.pages[0],
                messages: [message, ...oldData.pages[0].messages],
              },
              ...oldData.pages.slice(1),
            ],
          };
        },
      );
    });

    return () => {
      pusherClient.unsubscribe(`conversation-${activeChat.id}`);
    };
  }, [activeChat]);

  const [hasEnteredText, setHasEnteredText] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat, data]); // scroll to bottom whenever chat changes or new data arrives

  async function onSend(data: z.infer<typeof schema>) {
    if (!activeChat) return;

    // If it's a conversation (group or 1:1)
    if ("isGroup" in activeChat) {
      await mutation.mutateAsync({
        conversationId: activeChat.id,
        content: data.content,
      });
    }
    // if it's a one-on-one chat by selecting a user directly
    else if ("email" in activeChat) {
      await mutation.mutateAsync({
        recipientId: activeChat.id,
        content: data.content,
      });
    }
  }

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
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-muted rounded-full" />{" "}
          {/* avatar placeholder */}
          <div>
            <h4 className="text-lg font-semibold">{activeChat.name}</h4>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
      </div>
      <ScrollArea
        ref={scrollRef}
        className="flex-1 overflow-y-auto flex flex-col-reverse px-2 space-y-2"
        onScroll={(e) => {
          const top = e.currentTarget.scrollTop === 0;
          if (top && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
      >
        {messages.map((m) => {
          const isOwn = m.senderId === selfId; // you'll need selfId from session
          return (
            <div
              key={m.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"} px-4`}
            >
              <div
                className={`rounded-2xl px-4 py-2 max-w-xs text-sm ${
                  isOwn
                    ? "bg-green-600 text-white rounded-br-none"
                    : "bg-muted text-foreground rounded-bl-none"
                }`}
              >
                {m.content}
                <div className="text-[10px] opacity-70 mt-1 text-right">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </ScrollArea>
      <div className="h-12 w-full flex flex-row space-x-4 px-4">
        <Button size="lg" className="px-4 py-2">
          <Paperclip />
        </Button>
        <Input
          className="flex-1 rounded-full text-sm"
          placeholder="Type a message..."
          {...register("content")}
          value={watch("content")}
          onChange={(e) => {
            setValue("content", e.target.value);
            setHasEnteredText(e.target.value.trim().length > 0);
          }}
        />
        <Button size="lg" onClick={handleSubmit(onSend)} className="px-4 py-2">
          {hasEnteredText ? <Send /> : <Mic />}
        </Button>
      </div>
    </div>
  );
}
