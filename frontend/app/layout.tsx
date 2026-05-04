import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memolet — Memory-Augmented AI Workspace",
  description: "Visual memory workspace powered by semantic memolets and LLM-contextual chat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
