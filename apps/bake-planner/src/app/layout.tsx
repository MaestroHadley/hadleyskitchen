import type { Metadata } from "next";
import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Libre_Baskerville({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-display" });
const body = Source_Sans_3({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: "Bake Planner | Hadley’s Kitchen", template: "%s | Hadley’s Kitchen Bake Planner" },
  description: "Save recipes once, plan market bakes visually, and create clear production reports.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable}`}><body>{children}</body></html>;
}
