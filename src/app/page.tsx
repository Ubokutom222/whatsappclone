import { HomeView } from "@/modules/home/views/HomeView";
import { trpc } from "@/trpc/server";
import { HydrateClient } from "@/trpc/server";

export default async function HomePage() {
  void (await trpc.home.getUsers.prefetch());
  void (await trpc.home.getConversations.prefetch());
  return (
    <HydrateClient>
      <HomeView />
    </HydrateClient>
  );
}
