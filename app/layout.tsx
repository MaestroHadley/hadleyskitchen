import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hadley’s Kitchen",
  description: "Baking prep planner",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="hk-shell">
          <div className="hk-topbar" />
          <div className="hk-content">{children}</div>
          <footer className="hk-footer">Hadley&apos;s Kitchen</footer>
        </div>
      </body>
    </html>
  );
}
