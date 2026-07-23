import {
  convexAuth,
  getAuthUserId,
  modifyAccountCredentials,
} from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError, v } from "convex/values";
import { action, query } from "./_generated/server";
import { api } from "./_generated/api";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    // Auto-promote the first user to admin so the app has an owner without a
    // separate setup wizard or hardcoded admin credentials.
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      if (existingUserId) return;
      const userCount = (await ctx.db.query("users").take(2)).length;
      if (userCount === 1) {
        await ctx.db.patch(userId, { isAdmin: true });
      }
    },
  },
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});

// Change the signed-in user's password. The caller must be authenticated;
// the active session is the access proof, so no current-password challenge.
export const changePassword = action({
  args: {
    newPassword: v.string(),
  },
  handler: async (ctx, { newPassword }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("You must be signed in to change your password.");
    }
    if (newPassword.length < 8) {
      throw new ConvexError("Password must be at least 8 characters.");
    }

    const user = await ctx.runQuery(api.auth.loggedInUser);
    if (!user?.email) {
      throw new ConvexError(
        "This account has no email and cannot use password sign-in.",
      );
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: user.email, secret: newPassword },
    });
  },
});
