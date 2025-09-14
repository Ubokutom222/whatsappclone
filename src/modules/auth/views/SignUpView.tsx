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
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(64, "Username cannot be more than 64 characters"),
  email: z.email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot be more that 128 characters"),
});
export function SignUpView() {
  const [isPasswordSeen, setIsPasswordSeen] = useState<boolean>(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
  });

  const mutation = trpc.auth.signUp.useMutation({
    onSuccess() {
      toast.success("You have registered sucessfully. Redirecting....");
      router.push("/");
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    await mutation.mutateAsync({
      username: data.username,
      email: data.email,
      password: data.password,
    });
  }

  return (
    <Card className="w-full mx-4 lg:w-1/3 lg:m-0">
      <CardHeader>
        <CardTitle>Join Over 2.5 million Users</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="username"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
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
            <Button type="submit">Sign Up</Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center items-center">
        <span className="space-x-2">
          Already have an account?
          <Button variant="link" asChild>
            <Link prefetch href="/sign-in">
              Sign In
            </Link>
          </Button>
        </span>
      </CardFooter>
    </Card>
  );
}
