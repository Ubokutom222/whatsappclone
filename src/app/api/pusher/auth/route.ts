// app/api/pusher/auth/route.ts
import { NextResponse } from "next/server";
import pusher from "@/lib/pusher";
import { auth as betterAuth } from "@/lib/auth";
import db from "@/db";
import { conversationMembers } from "@/db/schema";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  const body = await req.formData();
  const socketId = body.get("socket_id") as string;
  const channel = body.get("channel_name") as string;

  // ✅ Auth check: verify user has access to this conversation
  const session = await betterAuth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user.id;
  if (!userId) {
    return new Response("Unauthorized", { status: 403 });
  }

  // Example: only allow if user is a member of the conversation
  if (channel.startsWith("private-conversation-")) {
    const conversationId = channel.replace("private-conversation-", "");

    const [isMember] = await db
      .select()
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId),
        ),
      )
      .limit(1);

    if (!isMember) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const auth = pusher.authorizeChannel(socketId, channel);
  return NextResponse.json(auth);
}
