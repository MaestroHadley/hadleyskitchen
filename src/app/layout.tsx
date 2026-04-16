import type { Metadata } from "next";
import { Libre_Baskerville } from "next/font/google";
import { SiteShell } from "@/components/site-shell";
import { siteContent } from "@/content/site";
import "./globals.css";

const bodyFont = Libre_Baskerville({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: siteContent.site.name,
    template: `%s | ${siteContent.site.name}`,
  },
  description: siteContent.site.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={bodyFont.variable}>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
