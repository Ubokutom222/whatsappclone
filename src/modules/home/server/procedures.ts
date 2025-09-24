import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import db from "@/db";
import { asc, eq, desc, and, sql, lt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  conversations,
  conversationMembers,
  messages,
  user,
} from "@/db/schema";
import { nanoid } from "nanoid";
import pusher from "@/lib/pusher";

const homeRouter = createTRPCRouter({
  getSession: protectedProcedure.query(async ({ ctx }) => {
    return ctx.session;
  }),
  getUsers: protectedProcedure.query(async () => {
    try {
      const users = await db.select().from(user).orderBy(asc(user.name));
      return users;
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Server Error",
      });
    }
  }),
  sendMessage: protectedProcedure
    .input(
      z
        .object({
          conversationId: z.string().min(1).optional(),
          recipientId: z.string().min(1).optional(),
          content: z.string().trim().max(4000).optional(),
          mediaUrl: z.string().url().optional(),
          mediaType: z.enum(["image", "video", "file"]).optional(),
        })
        .refine((d) => d.conversationId || d.recipientId, {
          message: "Either conversationId or receipientId must be provided",
          path: ["conversationId"],
        })
        .refine((d) => !!(d.content?.trim() || d.mediaUrl), {
          message: "Content or MediaUrl is required",
          path: ["content"],
        })
        .refine((d) => !d.mediaUrl || !!d.mediaType, {
          message: "mediaType is requried when mediaUrl is provided",
          path: ["mediaType"],
        }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const senderId = ctx.session.user.id;

        let conversationId = input.conversationId;

        if (!conversationId) {
          if (!input.recipientId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Either conversationid or recipientId must be provided",
            });
          }

          // Check if conversation already exists
          const existing = await db
            .select({ id: conversations.id })
            .from(conversations)
            .innerJoin(
              conversationMembers,
              eq(conversationMembers.conversationId, conversations.id),
            )
            .where(eq(conversations.isGroup, false))
            .groupBy(conversations.id)
            .having(
              and(
                sql`COUNT(*) = 2`, // must have exactly 2 members
                sql`bool_and(${conversationMembers.userId} in (${senderId}, ${input.recipientId}))`,
              ),
            )
            .limit(1);

          if (existing.length > 0) {
            conversationId = existing[0].id;
          } else {
            // Create new conversation
            const newConversation = await db
              .insert(conversations)
              .values({
                id: nanoid(),
                isGroup: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning();

            await db.insert(conversationMembers).values([
              { conversationId: newConversation[0].id, userId: senderId },
              {
                conversationId: newConversation[0].id,
                userId: input.recipientId,
              },
            ]);

            conversationId = newConversation[0].id;
          }
        }

        // Insert the message
        const [newMessage] = await db
          .insert(messages)
          .values({
            id: nanoid(),
            conversationId,
            senderId,
            content: input.content,
            createdAt: new Date(),
            messageType: input.mediaType ?? "text",
            mediaUrl: input.mediaUrl,
          })
          .returning();

        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));

        try {
          await pusher.trigger(
            `private-conversation-${conversationId}`,
            "new-message",
            {
              id: newMessage.id,
              content: newMessage.content,
              senderId: newMessage.senderId,
              createdAt: newMessage.createdAt,
              messageType: newMessage.messageType,
              mediaUrl: newMessage.mediaUrl,
            },
          );
        } catch (err) {
          // Don't fail the mutation; message is already stored.
          console.warn("Pusher Trigger faild", err);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") console.log(error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server Error",
        });
      }
    }),
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    try {
      const convs = await db
        .select({
          id: conversations.id,
          isGroup: conversations.isGroup,
          name: conversations.name,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
        })
        .from(conversations)
        .innerJoin(
          conversationMembers,
          eq(conversations.id, conversationMembers.conversationId),
        )
        .where(eq(conversationMembers.userId, ctx.session.user.id))
        .orderBy(desc(conversations.updatedAt));

      // Step 2: for each conversation, fetch its members
      const results = await Promise.all(
        convs.map(async (conv) => {
          const members = await db
            .select({
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              emailVerified: user.emailVerified,
            })
            .from(user)
            .innerJoin(
              conversationMembers,
              eq(user.id, conversationMembers.userId),
            )
            .where(eq(conversationMembers.conversationId, conv.id));

          return {
            ...conv,
            members,
          };
        }),
      );

      return results;
    } catch (error) {
      if (process.env.NODE_ENV === "development") console.log(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Server Error",
      });
    }
  }),
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.iso.datetime().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const { conversationId, limit, cursor } = input;

        const rows = await db
          .select()
          .from(messages)
          .where(
            cursor
              ? and(
                  eq(messages.conversationId, conversationId),
                  lt(messages.createdAt, new Date(cursor)),
                )
              : eq(messages.conversationId, conversationId),
          )
          .orderBy(desc(messages.createdAt))
          .limit(limit + 1);

        let nextCursor: string | undefined;
        if (rows.length > limit) {
          const last = rows[rows.length - 1]; // the oldest in this page
          rows.pop();
          nextCursor = last.createdAt.toISOString();
        }

        return {
          messages: rows,
          nextCursor,
        };
      } catch (error) {
        if (process.env.NODE_ENV === "development") console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server Error",
        });
      }
    }),
});

export default homeRouter;
