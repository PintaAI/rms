import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import prisma from "./prisma";

const devOrigins = [
  "http://localhost:3000",
  "http://100.108.102.102:3000",
  "http://192.168.0.102:3000",
  "http://127.0.0.1:3000",
];

const trustedOrigins = process.env.DEV_MODE === "true"
  ? devOrigins
  : [process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"];

export const auth = betterAuth({
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "admin",
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/get-session" || ctx.path === "/session") {
        const returned = ctx.context.returned as { user?: { id: string } } | undefined;
        if (returned?.user) {
          const subscription = await prisma.subscription.findUnique({
            where: { userId: returned.user.id },
            select: { plan: true },
          });
          return ctx.json({
            ...returned,
            user: {
              ...returned.user,
              plan: subscription?.plan,
            },
          });
        }
      }
    }),
  },
});