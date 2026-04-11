import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiz AI - Tr\u00f2 ch\u01a1i \u00f4n b\u00e0i th\u00f4ng minh",
  description: "\u1ee8ng d\u1ee5ng AI t\u1ea1o c\u00e2u h\u1ecfi tr\u1eafc nghi\u1ec7m cho h\u1ecdc sinh ti\u1ec3u h\u1ecdc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
