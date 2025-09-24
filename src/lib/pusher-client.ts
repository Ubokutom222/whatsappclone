// lib/pusher-client.ts
import Pusher from "pusher-js";

// Helpful during development: see Pusher logs in the browser console
if (process.env.NODE_ENV === "development") {
  Pusher.logToConsole = true;
}

/**
 * Create a Pusher client instance.
 *
 * This is configured for private channels:
 * - `authEndpoint` points to /api/pusher/auth (your server route)
 * - Passes Authorization header (recommended) or cookies if your server is cookie-based
 */
const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  forceTLS: true,

  // 👇 This must match your server route
  authEndpoint: "/api/pusher/auth",

  // Option A: token header (recommended)
  // auth: {
  //   headers: {
  //     Authorization: `Bearer ${yourToken}`,
  //   },
  // },

  // Option B: cookie/session auth (requires correct CORS & cookies)
  auth: {
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
  },
});

export default pusherClient;
