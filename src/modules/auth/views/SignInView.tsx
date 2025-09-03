"use client";
import { useForm } from "react-hook-form";
import {
  Form,
  FormMessage,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

const formSchema = z.object({
  email: z.email(),
  password: z.string().nonempty(),
});

export function SignInView() {
  const [isPasswordSeen, setIsPasswordSeen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const { error } = await authClient.signIn.email({
      email: data.email, // required
      password: data.password, // required
      callbackURL: "/",
    });

    if (error?.message) {
      setErrorMessage(error?.message);
    }
  }
  return (
    <Card className="w-full mx-4 lg:w-1/3 lg:m-0">
      <CardHeader>
        <CardTitle>Sign In To Your Account</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={isPasswordSeen ? "text" : "password"}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setIsPasswordSeen(!isPasswordSeen)}
                    >
                      {isPasswordSeen ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {errorMessage && (
              <div className="bg-destructive/20 text-destructive text-base font-bold">
                {errorMessage}
              </div>
            )}
            <Button type="submit">Sign In</Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center items-center">
        <span className="space-x-2">
          Don&apos;t have an account?
          <Button variant="link" asChild>
            <Link prefetch href="/sign-up">
              Sign Up
            </Link>
          </Button>
        </span>
      </CardFooter>
    </Card>
  );
}
