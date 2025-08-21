"use client";
import { useState, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";
import code from "country-calling-code";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
  country: z.string(),
  phoneNumber: z
    .number()
    .refine(
      (value) => !isNaN(Number(value)),
      "Phone number must be a valid number",
    ),
  name: z.string().nonempty().max(128, "Name cannot exceed 64 characters"),
  profilePictureURL: z.string(),
});

export function SignInView() {
  const trpc = useTRPC();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: 0,
      country: "",
      name: "",
      profilePictureURL: "",
    },
  });

  const [step, setStep] = useState<"otp" | "number">("number");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [value, setValue] = useState<string>("");
  const [otp, setOTP] = useState<string | null>(null);

  const mutation = useMutation(trpc.auth.sendCode.mutationOptions());

  useEffect(() => {
    function onSubmit(data: z.infer<typeof formSchema>) {
      console.log(data);
      router.push("/");
    }

    if (isVerified) {
      form.handleSubmit(onSubmit);
    }
  }, [isVerified]);

  async function generateOTP(e: React.FormEvent) {
    e.preventDefault();
    const { OTP } = await mutation.mutateAsync({
      phoneNumber: `${form.getValues("country")}${form.getValues("phoneNumber")}`,
    });
    setOTP(OTP);
    setStep("otp");
  }

  function verifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (value === otp) {
      setIsVerified(true);
      router.push("/");
    } else {
      setIsVerified(false);
    }
  }

  return (
    <div className="w-96 mx-auto mt-20 p-6 border rounded-2xl shadow-md overflow-hidden relative space-y-4">
      <div className="flex flex-row space-x-6 text-5xl font-bold text-light-green">
        <FaWhatsapp />
        <span>WhatsApp</span>
      </div>
      <AnimatePresence mode="wait">
        <Form {...form}>
          <motion.form
            key={step}
            onSubmit={step === "number" ? generateOTP : verifyOTP}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col space-y-6"
          >
            {step === "number" && (
              <div className="flex flex-col space-y-2">
                {/* phone number input step */}
                <span className="text-base text-surfie-green text-center">
                  Enter Your Phone Number
                </span>
                <div className="w-full flex flex-row">
                  <FormField
                    name="country"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="rounded-r-none w-fit">
                            <SelectValue placeholder="Country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {code.map((country, idx) => (
                            <SelectItem
                              value={`+${country.countryCodes[0]}`}
                              key={`${country.country}-${country.countryCodes[0]}-${idx}`}
                              className="font-bold"
                            >
                              {country.country} +{country.countryCodes[0]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    name="phoneNumber"
                    control={form.control}
                    render={({ field }) => (
                      <FormControl>
                        <Input {...field} className="rounded-l-none" />
                      </FormControl>
                    )}
                  />
                </div>
                <Button type="submit">Confirm Number</Button>
              </div>
            )}

            {step === "otp" && (
              <>
                {/* otp step */}
                <div className="space-y-4 w-full flex justify-center items-center flex-col">
                  <span className="text-base text-surfie-green">
                    Enter your one-time password
                  </span>
                  <InputOTP
                    maxLength={6}
                    value={value}
                    onChange={(value) => setValue(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button type="submit">Verify</Button>
              </>
            )}
          </motion.form>
        </Form>
      </AnimatePresence>
    </div>
  );
}
