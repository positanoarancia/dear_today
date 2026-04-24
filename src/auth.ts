import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertProfile } from "@/server/profile/repository";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [Google],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile?.sub) {
        const displayName =
          profile.name || profile.email?.split("@")[0] || "Dear Today user";
        const authProfile = await upsertProfile({
          provider: "google",
          providerAccountId: profile.sub,
          displayName,
        });

        token.profileId = authProfile.id;
        token.name = authProfile.displayName;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.profileId === "string") {
        session.user.id = token.profileId;
      }

      return session;
    },
  },
});
