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
import { Eye, EyeOff, Lock, User } from "lucide-react";

/**
 * Formulaire de connexion sécurisé sans divulgation d'informations sensibles.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const urlError = searchParams.get("error");

  React.useEffect(() => {
    if (urlError) {
      if (urlError === "CredentialsSignin") {
        setErrorMessage("Identifiants incorrects. Veuillez vérifier votre identifiant et votre mot de passe.");
      } else {
        setErrorMessage("Session expirée ou erreur d'authentification. Veuillez vous reconnecter.");
      }
    }
  }, [urlError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setErrorMessage("Veuillez renseigner votre identifiant et votre mot de passe.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        identifier: cleanIdentifier,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error) {
        setErrorMessage("Identifiants incorrects. Veuillez vérifier votre identifiant et mot de passe.");
        setIsLoading(false);
        return;
      }

      // Redirection complète pour prise en compte immédiate du cookie de session
      window.location.href = result?.url || callbackUrl;
    } catch (error) {
      console.error("[login] Erreur d'authentification :", error);
      setErrorMessage("Une erreur inattendue est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl border-border max-w-md w-full mx-auto">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-sm">
          IMT
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Projet Ouvert IMT
        </CardTitle>
        <CardDescription>
          Connectez-vous avec votre identifiant ou votre prénom
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
            <Label htmlFor="identifier">Identifiant</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="Ex: etienne, hugo..."
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pl-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Accès sécurisé réservé aux membres du groupe de projet
          </p>
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
