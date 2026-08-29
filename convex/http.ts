import { httpRouter } from "convex/server";
import { verifyClerkWebhook } from "@workspace/auth/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/clerk/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (secret === undefined) {
      console.error("CLERK_WEBHOOK_SECRET is not set on this deployment");
      return new Response("Not configured", { status: 500 });
    }

    const payload = await verifyClerkWebhook(request, secret);
    if (payload === null) {
      // Never answer 200 to an unverified delivery — Clerk would mark a forged
      // request as accepted and stop retrying the real one.
      return new Response("Invalid signature", { status: 400 });
    }

    const outcome = await ctx.runMutation(internal.auth.applyWebhookEvent, { payload });
    console.log("Clerk webhook", outcome);
    return new Response(null, { status: 200 });
  }),
});

export default http;
