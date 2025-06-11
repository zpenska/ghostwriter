import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghostwriter",
  description: "Professional letter writing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-radio antialiased">
        {children}
      </body>
    </html>
  );
}