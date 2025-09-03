import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import db from "@/db";
import { user } from "@/db/schema";
import { asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const homeRouter = createTRPCRouter({
  getSession: protectedProcedure.query(async ({ ctx }) => {
    return ctx.session;
  }),
  getUsers: protectedProcedure.query(async () => {
    try {
      const users = await db.select().from(user).orderBy(asc(user.name));
      return users;
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),
});

export default homeRouter;
