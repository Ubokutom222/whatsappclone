"use client";
import { useActiveChatContext } from "@/modules/providers/ActiveChatProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  content: z.string(),
});
export function ChatView() {
  const { activeChat } = useActiveChatContext();
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
  const [hasEnteredText, setHasEnteredText] = useState<boolean>(false);

  async function onSend(data: z.infer<typeof schema>) {
    if (!activeChat) return;

    // If it's a group chat (conversation)
    if ("isGroup" in activeChat && activeChat.isGroup) {
      await mutation.mutateAsync({
        conversationId: activeChat.id,
        content: data.content,
      });
    }
    // If it's a one-on-one chat (user)
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
      <div className="h-16 flex items-center px-6 w-full">
        <h4 className="text-lg font-semibold">{activeChat.name}</h4>
      </div>
      <div className="flex-1"></div>
      <div className="h-12 w-full flex flex-row space-x-4 px-4">
        <Button size="lg">
          <Paperclip />
        </Button>
        <Textarea
          className="w-full flex-1 min-h-10 max-h-32 overflow-y-auto"
          placeholder="Type A Message..."
          {...register("content")}
          value={watch("content")}
          onChange={(e) => {
            setValue("content", e.target.value);
            setHasEnteredText(e.target.value.trim().length > 0);
          }}
        />
        <Button size="lg" onClick={handleSubmit(onSend)}>
          {hasEnteredText ? <Send /> : <Mic />}
        </Button>
      </div>
    </div>
  );
}
