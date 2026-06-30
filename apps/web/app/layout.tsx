import type { Metadata } from "next";
import Providers from "@/components/shared/Providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Tacet — Confidential rewards for open-source contributors",
  description:
    "Seal allocations. Contributors decrypt only their own share. The chain never sees amounts.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Tacet",
    description: "Paid. Not published.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-ink-50">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link href="https://fonts.cdnfonts.com/css/geist-sans" rel="stylesheet" />
        <link href="https://fonts.cdnfonts.com/css/geist-mono" rel="stylesheet" />
      </head>
      <body className="bg-ink-50 text-ink-1000 font-sans antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
