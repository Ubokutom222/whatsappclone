import { HomeView } from "@/modules/home/views/HomeView";
import { trpc } from "@/trpc/server";
import { HydrateClient } from "@/trpc/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    void (await trpc.home.getUsers.prefetch());
    void (await trpc.home.getConversations.prefetch());
    return (
      <HydrateClient>
        <HomeView />
      </HydrateClient>
    );
  } else {
    redirect("/sign-in");
    return null;
  }
}
