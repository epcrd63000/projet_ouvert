"use client";

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

/**
 * Formulaire de connexion interactif avec gestion d'état et pré-remplissage.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const urlError = searchParams.get("error");

  React.useEffect(() => {
    if (urlError) {
      if (urlError === "CredentialsSignin") {
        setErrorMessage(
          "Identifiants incorrects. Veuillez vérifier votre adresse email et votre mot de passe."
        );
      } else {
        setErrorMessage(
          "Erreur d'authentification ou session expirée. Veuillez vous reconnecter."
        );
      }
    }
  }, [urlError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    console.log("[login] Soumission du formulaire...");
    console.log("[login] Email :", email.trim().toLowerCase());
    console.log("[login] Callback URL :", callbackUrl);

    try {
      console.log("[login] Appel signIn('credentials') en cours...");
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      console.log("[login] Résultat signIn :", JSON.stringify(result, null, 2));

      if (!result || result.error) {
        console.error("[login] Erreur signIn :", result?.error);
        setErrorMessage(
          "Identifiants invalides. Veuillez vérifier votre adresse email et mot de passe."
        );
        setIsLoading(false);
        return;
      }

      console.log("[login] Connexion réussie ! Redirection vers :", callbackUrl);
      // Navigation complète pour garantir l'envoi immédiat du cookie de session au serveur
      // et éliminer les comportements de cache client figé dans Next.js 14 App Router
      window.location.href = result?.url || callbackUrl;
    } catch (error) {
      console.error("[login] Exception attrapée :", error);
      setErrorMessage("Une erreur inattendue est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (testEmail: string) => {
    setEmail(testEmail);
    setPassword("password");
  };

  return (
    <Card className="shadow-lg border-border">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
          IMT
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Projet Ouvert IMT
        </CardTitle>
        <CardDescription>
          Connectez-vous avec vos identifiants institutionnels
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="etienne@imt.fr"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <span className="text-xs text-muted-foreground">
                Défaut : password
              </span>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </Button>

          <div className="w-full pt-2 border-t border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Comptes de test (Seed) :
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-secondary transition-colors"
                onClick={() => handleQuickLogin("etienne@imt.fr")}
              >
                Etienne (Admin)
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-secondary transition-colors"
                onClick={() => handleQuickLogin("hugo@imt.fr")}
              >
                Hugo (Membre)
              </Badge>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

/**
 * Page de connexion client enveloppée dans un Suspense boundary.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center p-8 text-sm text-muted-foreground">
          Chargement du formulaire de connexion...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
