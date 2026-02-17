import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Compare - 複数AIの回答を比較",
  description: "ChatGPT, Claude, Zariの回答を並べて比較できるツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
