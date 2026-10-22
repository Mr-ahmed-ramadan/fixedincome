import "../globals.css";

export const metadata = { title: "AGYAL admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
