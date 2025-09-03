import { createAuthClient } from "better-auth/react"; // make sure to import from better-auth/react
import { nextCookies } from "better-auth/next-js";

export const authClient = createAuthClient({
  //you can pass client configuration here
  plugins: [nextCookies()],
});
