/**
 * Growth milestones shown in /admin → Overview. Each one watches a number and,
 * as it approaches its limit, tells you what to do (upgrade a plan, add a key…).
 * Limits are those of the plans in use at launch; adjust here if plans change.
 */

export type Metrics = {
  emailsToday: number;
  emailsThisMonth: number;
  emailDailyCap: number;
  pendingEmails: number;
  signupsThisMonth: number;
  signupsTotal: number;
  partnerRequests: number;
  blockedToday: number;
  calUrlSet: boolean;
  googleSignInSet: boolean;
};

export type MilestoneStatus = "ok" | "soon" | "hit";

export type Milestone = {
  id: string;
  title: string;
  /** Current value and the point where action is needed. */
  value: number;
  limit: number;
  unit: string;
  action: string;
  link?: { label: string; href: string };
  cost?: string;
  /** Checklist items that can't be measured from here; shown until marked done. */
  manual?: boolean;
};

/** "Soon" from 70% of the limit, "hit" at the limit. */
export function statusOf(m: Pick<Milestone, "value" | "limit">): MilestoneStatus {
  if (m.value >= m.limit) return "hit";
  if (m.value >= m.limit * 0.7) return "soon";
  return "ok";
}

/** True once EMAIL_DAILY_CAP has been raised above the free-plan default, i.e. Resend was upgraded. */
const onPaidEmail = (cap: number) => cap > 100;

export function milestones(m: Metrics): Milestone[] {
  const resendFree: Milestone[] = [
    {
      id: "resend-daily",
      title: "Emails per day (Resend free: 100/day)",
      value: Math.max(m.emailsToday, m.pendingEmails > 0 ? m.emailDailyCap : 0),
      limit: m.emailDailyCap,
      unit: "emails today",
      action: "Upgrade Resend to Pro, then in Vercel set EMAIL_DAILY_CAP=1500 and redeploy. Queued emails can then be sent with “Send now”.",
      link: { label: "Resend billing", href: "https://resend.com/settings/billing" },
      cost: "$20/month for 50,000 emails",
    },
    {
      id: "resend-monthly",
      title: "Emails per month (Resend free: 3,000)",
      value: m.emailsThisMonth,
      limit: 3000,
      unit: "emails this month",
      action: "Upgrade Resend to Pro and raise EMAIL_DAILY_CAP (same step as above).",
      link: { label: "Resend billing", href: "https://resend.com/settings/billing" },
      cost: "$20/month",
    },
  ];
  const resendPaid: Milestone[] = [
    {
      id: "resend-pro-monthly",
      title: "Emails per month (Resend Pro: 50,000)",
      value: m.emailsThisMonth,
      limit: 50000,
      unit: "emails this month",
      action: "Move Resend to the 100k plan (or Scale) and raise EMAIL_DAILY_CAP to match.",
      link: { label: "Resend billing", href: "https://resend.com/settings/billing" },
      cost: "from $35/month",
    },
  ];

  return [
    ...(onPaidEmail(m.emailDailyCap) ? resendPaid : resendFree),
    {
      id: "database",
      title: "Database usage (Prisma Postgres free: ~100k operations/month ≈ 10,000 sign-ups)",
      value: m.signupsThisMonth,
      limit: 10000,
      unit: "sign-ups this month",
      action: "Upgrade Prisma Postgres to Starter and set a spending limit, so the database never pauses mid-month.",
      link: { label: "Prisma console", href: "https://console.prisma.io" },
      cost: "$10/month for 1M operations",
    },
    {
      id: "vercel-plan",
      title: "Vercel plan allows commercial use",
      value: 0,
      limit: 1,
      unit: "",
      manual: true,
      action: "In Vercel → Settings → Billing for the “Altrum tech projects” team, check it says Pro (Hobby is non-commercial). Set a Spend Management cap. Then mark this done.",
      link: { label: "Vercel billing", href: "https://vercel.com/altrum-tech-projects/~/settings/billing" },
      cost: "$20/month",
    },
    {
      id: "booking-link",
      title: "Partners can book a call",
      value: m.calUrlSet ? 0 : m.partnerRequests,
      limit: 1,
      unit: "partner requests without a booking link",
      action: "Create a free Cal.com page (30-min intro call) and add its link in Vercel as NEXT_PUBLIC_CAL_URL. Partners then get a “Book a call” button.",
      link: { label: "Cal.com", href: "https://cal.com/signup" },
      cost: "Free",
    },
    {
      id: "real-inbox",
      title: "A real inbox for hello@agyal.net",
      value: m.partnerRequests,
      limit: 5,
      unit: "partner requests",
      action:
        "Once partners start writing, get a mailbox for hello@agyal.net (e.g. Google Workspace or Zoho Mail) so you can reply from your own domain. First delete the old ImprovMX records in Vercel DNS; Claude can add the new mail records.",
      link: { label: "Google Workspace", href: "https://workspace.google.com" },
      cost: "Free (Zoho) to ~$7/month (Google)",
    },
    {
      id: "google-sign-in",
      title: "One-tap “Continue with Google”",
      value: m.googleSignInSet ? 0 : m.signupsTotal,
      limit: 100,
      unit: "sign-ups without Google sign-in",
      action: "Add the Google sign-in keys (AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET) in Vercel; faster sign-up usually means more sign-ups. Ask Claude for the step-by-step.",
      link: { label: "Google Cloud credentials", href: "https://console.cloud.google.com/apis/credentials" },
      cost: "Free",
    },
    {
      id: "bots",
      title: "Bot or spam attack",
      value: m.blockedToday,
      limit: 25,
      unit: "blocked attempts today",
      action: "Someone may be scripting sign-ups. Turn on Vercel Firewall's attack mode for the day, and ask Claude to add a free Cloudflare Turnstile check to the forms.",
      link: { label: "Vercel firewall", href: "https://vercel.com/altrum-tech-projects/agyal/firewall" },
      cost: "Free",
    },
    {
      id: "first-update",
      title: "Time for a waitlist update",
      value: m.signupsTotal,
      limit: 1000,
      unit: "sign-ups",
      action: "Send the waitlist its first update (what's new, timeline progress, invite friends). Ask Claude to draft it; at this size it needs Resend Pro.",
      cost: "Included in Resend Pro",
    },
  ];
}
