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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.VERCEL_PROJECT_PRODUCTION_URL ??
      "http://localhost:3000",
  ),
  title: {
    default: siteContent.site.name,
    template: `%s | ${siteContent.site.name}`,
  },
  description: siteContent.site.description,
  icons: {
    icon: "/images/hk-logo.png",
    shortcut: "/images/hk-logo.png",
    apple: "/images/hk-logo.png",
  },
  openGraph: {
    title: siteContent.site.name,
    description: siteContent.site.description,
    images: [
      {
        url: "/images/hk-logo.png",
        width: 1200,
        height: 1200,
        alt: "Hadley's Kitchen logo.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteContent.site.name,
    description: siteContent.site.description,
    images: ["/images/hk-logo.png"],
  },
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
