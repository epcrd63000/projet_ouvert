import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Min'IMOCA — Plateforme de Gestion de Projet",
    template: "%s | Min'IMOCA",
  },
  description:
    "Application de suivi, planification et gestion de projet pour l'équipe IMT CI1 (Projet Ouvert 2026-2027).",
  keywords: ["IMT", "Min'IMOCA", "Projet Ouvert", "Gestion de projet", "Gantt", "Kanban"],
  authors: [{ name: "Équipe Projet Ouvert IMT" }],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020817" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`min-h-screen bg-background font-sans text-foreground antialiased ${inter.variable}`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
