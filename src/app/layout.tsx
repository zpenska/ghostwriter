import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'Ghostwriter',
  icons: {
    icon: '/favicon.ico',
  },
}

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