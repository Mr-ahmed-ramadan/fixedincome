import { THEME_SCRIPT } from "@/components/theme-toggle";
import "../globals.css";

export const metadata = { title: "AGYAL admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="min-h-screen">
        {/* Before anything paints: apply the saved light/dark choice. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} suppressHydrationWarning />{children}</body>
    </html>
  );
}
