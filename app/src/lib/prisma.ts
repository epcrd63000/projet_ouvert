import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

/**
 * Déclaration globale pour stocker l'instance du client Prisma
 * et éviter la multiplication des connexions lors du hot reload en développement.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configuration du driver serverless en mode HTTP pur
// Bypasse le port 5432 (bloqué sur le réseau IMT) et élimine les problèmes de WebSocket
const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeonHTTP(connectionString, {});

/**
 * Singleton PrismaClient exporté pour les routes API et les Server Actions.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
