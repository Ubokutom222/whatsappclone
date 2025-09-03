import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { TRPCError } from "@trpc/server";

const authRouter = createTRPCRouter({
  signUp: baseProcedure
    .input(
      z.object({
        username: z.string().min(3).max(64),
        email: z.email(),
        password: z.string().min(8).max(128),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await auth.api.signUpEmail({
          body: {
            name: input.username,
            email: input.email,
            password: input.password,
          },
        });
      } catch (error) {
        if (process.env.NODE_ENV === "development") console.log(error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});

export default authRouter;
