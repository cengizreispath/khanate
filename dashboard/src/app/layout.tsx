import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khanate - Agent Orchestration",
  description: "Hierarchical multi-agent orchestration system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-zinc-950 text-white">
        {children}
      </body>
    </html>
  );
}
