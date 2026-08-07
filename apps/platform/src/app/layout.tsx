import type { Metadata } from "next";
import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Libre_Baskerville({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-display" });
const body = Source_Sans_3({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: "Hearthworks", template: "%s | Hearthworks" },
  description: "The operating system for independent bakers. Save recipes, plan production, and run market bakes with confidence.",
  icons: { icon: "/hearthworks-logo-dark.png", apple: "/hearthworks-logo-dark.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable}`}><body>{children}</body></html>;
}
