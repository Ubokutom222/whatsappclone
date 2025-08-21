import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import twilio from "twilio";
import { z } from "zod";

const authRouter = createTRPCRouter({
  sendCode: baseProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const client = twilio(
        `${process.env.TWILIO_ACCOUNT_SID}`,
        `${process.env.TWILIO_AUTH_TOKEN}`,
      );

      function generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
      }

      const OTP = generateOTP();
      try {
        const response = await client.messages.create({
          body: `Your WhatsApp Clone Verification Code is ${OTP}`,
          to: input.phoneNumber,
          from: "+15135403993",
        });

        console.log(response);
      } catch (error) {
        console.log(error);
      }

      return {
        OTP,
      };
    }),
});

export default authRouter;
