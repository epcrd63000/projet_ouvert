import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout dédié aux pages d'authentification (connexion, réinitialisation).
 * Centre le contenu dans un viewport responsive adapté aux modes clair et sombre.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 md:p-8">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
