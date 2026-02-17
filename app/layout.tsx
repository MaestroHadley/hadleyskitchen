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
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background:
            "radial-gradient(circle at 20% -10%, #f4efe3 0%, #fbfaf7 35%, #f8f7f3 100%)",
          color: "#1f2937",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ minHeight: "100vh" }}>{children}</div>
      </body>
    </html>
  );
}
