# أجيال · AGYAL: waitlist landing page

AGYAL will let investors in Egypt and the Arab world buy Egyptian fixed income
(T-bills, government bonds, sukuk, Eurobonds and high-grade corporate bonds)
from their phone. This site introduces it and collects:

- **Waitlist sign-ups**: name, email and mobile, or "Continue with Google".
  Each person confirms their email and then gets a personal invite link.
- **Partner requests** from brokers, banks and asset managers, with an optional
  link to book a call on Cal.com.

The site is bilingual. Arabic (right-to-left) is the default, and English is at
`/en`. Visitors are sent to their browser's language.

## Tech

- **Next.js 15** (App Router, TypeScript) + **Tailwind CSS**
- **Postgres + Prisma**
- **Auth.js** (Google sign-in only, no accounts)
- **Resend** for email (printed to the console in development)
- Hosted on **Vercel**

## Run it locally

```bash
cp .env.example .env          # then edit DATABASE_URL etc.
npm install
npx prisma migrate dev        # create the tables
npm run seed                  # load the starting yields
npm run dev                   # http://localhost:3000
```

Emails (confirmation links, welcome emails) appear in the terminal while
`EMAIL_PROVIDER=console`.

Checks: `npm run lint`, `npm run typecheck`, `npm test`.

## What's where

| Path | What it is |
| --- | --- |
| `src/app/[locale]/page.tsx` | The landing page (hero, yields, products, steps, waitlist, partners, FAQ) |
| `src/i18n/dictionaries.ts` | **All the words on the site and in emails, Arabic and English** |
| `src/app/[locale]/actions.ts` | Form handling (waitlist, partners, Google sign-in) |
| `src/lib/waitlist.ts` | Joining, email confirmation, invite links |
| `src/middleware.ts` | Language redirect; remembers `?ref=` invite codes and `?utm_*` tags |
| `src/app/admin` | Admin area: stats, edit yields, see/export sign-ups and partner requests |
| `public/brand`, `public/og` | Logo files, social profile image, link-preview images |
| `prisma/schema.prisma` | Database tables |

## Admin (`/admin`)

Sign in with `ADMIN_PASSWORD`. From there you can:

- **Yields**: add or edit the rates on the landing page. "Coupons/yr" 0 means
  paid at maturity (T-bills). Rates are shown as indicative and before taxes
  and fees. The page updates as soon as you save.
- **Waitlist / Partners**: browse, and download CSV files (they open in Excel
  with Arabic intact).
- **Overview**: totals and which `utm_source` each sign-up came from.

### Tracking social posts

Add tags to the link in each post, for example
`https://agyal.net/ar?utm_source=instagram&utm_campaign=launch`. The admin
overview then shows how many sign-ups each source brought in. Invite links
(`?ref=CODE`) are counted per member.

## Deploying (Vercel)

1. **Vercel → Add New Project →** import this GitHub repo.
2. **Storage → Create → Neon Postgres** and connect it to the project
   (this sets `DATABASE_URL`).
3. **Settings → Environment Variables**: add the values from `.env.example`
   (`APP_URL=https://agyal.net`, `AUTH_SECRET`, `ADMIN_PASSWORD`,
   `AUTH_GOOGLE_ID/SECRET`, `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`,
   `OWNER_EMAIL`, `NEXT_PUBLIC_CAL_URL`).
4. **Settings → Build**: set the build command to `npm run vercel-build`,
   which also applies database migrations. Deploy, then run `npm run seed` once
   against the production database (or add the rates in `/admin`).
5. **Domains**: add `agyal.net` and create the DNS records Vercel shows.
6. **Email**: in Resend, add the domain `agyal.net` and create its DNS records.
   To receive mail at hello@agyal.net in Gmail, set up free forwarding with
   ImprovMX or Cloudflare Email Routing.
7. **Google sign-in**: in Google Cloud → Credentials → your OAuth client, add
   the redirect URI `https://agyal.net/api/auth/callback/google`, and set the
   consent screen's privacy policy to `https://agyal.net/en/privacy`.

## Brand

Logo: "the ladder", three rising bars (a bond ladder, and three generations)
with a carnelian coupon dot. Colours: lapis `#1D47A3`, carnelian `#D0643A`, ink
`#0F1630`, paper `#F4F5FA`. Type: the Apple system font for English, IBM Plex
Sans Arabic for Arabic.
