import { NextResponse } from "next/server";

/**
 * Endpoint de contrôle de santé applicatif.
 * Retourne le statut et le timestamp serveur.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "imt-projet-ouvert",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  });
}
