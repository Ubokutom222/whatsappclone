import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import db from "@/db";
import { asc, eq, desc, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  conversations,
  conversationMembers,
  messages,
  user,
} from "@/db/schema";
import { nanoid } from "nanoid";

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
      z.object({
        conversationId: z.string().optional(),
        recipientId: z.string().optional(),
        content: z.string().optional(),
        mediaUrl: z.string().optional(),
        mediaType: z.enum(["image", "video", "file"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // if (true) {
        //   const conversationId = nanoid();

        //   const selfId = ctx.session.user.id;
        //   const uniqueMembers = Array.from(new Set([selfId, ...input.members]));
        //   if (uniqueMembers.length < 2) {
        //     throw new TRPCError({ code: "BAD_REQUEST", message: "At leaast one other member is required" })
        //   }

        //   await db.transaction(async (tx) => {
        //     await tx.insert(conversations).values({
        //       id: conversationId,
        //       isGroup: false,
        //       name: null
        //     })
        //     await tx.insert(conversationMembers).values(
        //       uniqueMembers.map((memberId) => ({
        //         conversationId,
        //         userId: memberId,
        //         joinedAt: new Date(),
        //       }))
        //     )
        //   })
        // }

        if (process.env.NODE_ENV === "development") console.log(input);

        const senderId = ctx.session.user.id;

        let conversationId = input.conversationId;

        if (!conversationId) {
          if (!input.recipientId) {
            throw new Error(
              "Either conversationId or recipientId must be provided",
            );
          }

          // Check if conversation already exists
          const existing = await db
            .select()
            .from(conversations)
            .where(
              and(
                eq(conversations.isGroup, false),
                inArray(
                  conversations.id,
                  db
                    .select({ id: conversationMembers.conversationId })
                    .from(conversationMembers)
                    .where(
                      inArray(conversationMembers.userId, [
                        senderId,
                        input.recipientId,
                      ]),
                    ),
                ),
              ),
            );

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
        await db.insert(messages).values({
          id: nanoid(),
          conversationId,
          senderId,
          content: input.content,
          createdAt: new Date(),
        });
      } catch (error) {
        if (process.env.NODE_ENV === "development") console.log(error);
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
});

export default homeRouter;
