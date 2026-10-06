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
    default: "Projet Ouvert IMT — Plateforme de Gestion de Projet",
    template: "%s | Projet Ouvert IMT",
  },
  description:
    "Application de suivi, planification et gestion de projet pour l'équipe IMT CI1 (Projet Ouvert 2026-2027).",
  keywords: ["IMT", "Projet Ouvert", "Gestion de projet", "Gantt", "Kanban"],
  authors: [{ name: "Équipe Projet Ouvert IMT" }],
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
