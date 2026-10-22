import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { cookies } from "next/headers";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/lib/locale";
import { upsertGoogleMember } from "@/lib/waitlist";

// Google sign-in only. Sessions are short-lived JWT cookies used just to finish
// joining the waitlist (adding a mobile number); there are no user accounts yet.
export const { handlers, auth, signIn } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 },
  pages: { error: "/" },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") return false;
      const email = (profile?.email || user.email || "").toLowerCase();
      if (!email || profile?.email_verified === false) return false;

      const jar = await cookies();
      const saved = jar.get(LOCALE_COOKIE)?.value;
      await upsertGoogleMember({
        name: profile?.name || user.name || email.split("@")[0],
        email,
        locale: isLocale(saved) ? saved : DEFAULT_LOCALE,
        attribution: parseAttribution(jar.get(ATTRIBUTION_COOKIE)?.value),
      });
      return true;
    },
  },
});
