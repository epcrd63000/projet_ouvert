import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Page racine de l'application.
 * Redirige vers le tableau de bord si l'utilisateur est connecté, sinon vers la page de connexion.
 * Assure la cohérence et la défense en profondeur côté serveur (RSC) avec le middleware.
 */
export default async function RootPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
