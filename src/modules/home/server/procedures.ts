import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import db from "@/db";
import { asc, eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { user } from "@/db/schema";
import { z } from "zod";
import { conversations, conversationMembers } from "@/db/schema";
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
  startConversation: protectedProcedure
    .input(z.object({ members: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      try {
        const conversationId = nanoid();

        await db.insert(conversations).values({
          id: conversationId,
          isGroup: false,
          name: null,
        });

        input.members.forEach(async (user) => {
          await db.insert(conversationMembers).values({
            conversationId,
            userId: user,
            joinedAt: new Date(),
            role: null,
          });
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
