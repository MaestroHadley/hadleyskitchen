import type { Metadata } from "next";
import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const display = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hearthworks.co"),
  title: {
    default: "Hearthworks — The operating system for independent bakers",
    template: "%s | Hearthworks",
  },
  description:
    "Plan recipes, production, purchasing, and selling-day results in one calm workflow built around the way independent bakers actually work.",
  keywords: [
    "bakery software",
    "microbakery",
    "cottage bakery",
    "bake planning",
    "production planning",
    "farmers market bakery",
    "farm stand bakery",
    "porch stand bakery",
  ],
  icons: {
    icon: "/hearthworks-logo.svg",
    shortcut: "/hearthworks-logo.svg",
    apple: "/hearthworks-logo-light.png",
  },
  openGraph: {
    type: "website",
    url: "https://hearthworks.co",
    siteName: "Hearthworks",
    title: "Hearthworks — Run the bakery. Keep the craft.",
    description:
      "A calm, connected operating system for independent bakers—from recipe and production planning to selling-day results.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Hearthworks — Run the bakery. Keep the craft.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hearthworks — Run the bakery. Keep the craft.",
    description:
      "A calm, connected operating system for independent bakers—from recipe and production planning to selling-day results.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
