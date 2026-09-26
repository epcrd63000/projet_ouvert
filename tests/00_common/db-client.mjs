import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { appDir, loadAppEnv } from "./config.mjs";

let cachedPrisma = null;

/**
 * Tente d'instancier PrismaClient de manière dynamique via son URL de fichier ESM.
 * Initialise également les variables d'environnement nécessaires depuis app/.env.
 * @returns {Promise<any>}
 */
export async function getPrismaClient() {
  if (cachedPrisma) return cachedPrisma;

  const envVars = loadAppEnv();
  // Injection propre des variables d'environnement dans process.env
  for (const [key, value] of Object.entries(envVars)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  if (envVars.DATABASE_URL) {
    process.env.DATABASE_URL = envVars.DATABASE_URL;
  }
  if (envVars.DIRECT_URL) {
    process.env.DIRECT_URL = envVars.DIRECT_URL;
  }

  try {
    const clientPath = path.resolve(appDir, "node_modules/@prisma/client/index.js");
    if (!fs.existsSync(clientPath)) {
      throw new Error(`PrismaClient introuvable au chemin : ${clientPath}`);
    }

    const { PrismaClient } = await import(pathToFileURL(clientPath).href);
    cachedPrisma = new PrismaClient();
    return cachedPrisma;
  } catch (err) {
    console.error("Échec lors du chargement ou de l'initialisation de PrismaClient :", err.message);
    throw err;
  }
}

/**
 * Récupère les noms des tables de la base PostgreSQL Neon directement via PrismaClient.
 * Aucune analyse statique de repli : garantit une véritable interrogation de la base de données.
 * @returns {Promise<{ source: 'db', tables: string[] }>}
 */
export async function getDatabaseTables() {
  const prisma = await getPrismaClient();

  const rows = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != '_prisma_migrations';
  `;

  return {
    source: "db",
    tables: rows.map((r) => r.table_name || r.TABLE_NAME),
  };
}

/**
 * Récupère la liste des utilisateurs enregistrés en base.
 * @returns {Promise<any[]>}
 */
export async function fetchAllUsers() {
  const prisma = await getPrismaClient();
  return await prisma.user.findMany({
    orderBy: { email: "asc" },
  });
}

/**
 * Récupère la liste des jalons Gantt enregistrés en base.
 * @returns {Promise<any[]>}
 */
export async function fetchAllMilestones() {
  const prisma = await getPrismaClient();
  return await prisma.ganttMilestone.findMany({
    orderBy: { startDate: "asc" },
  });
}

/**
 * Ferme proprement la connexion au client Prisma si actif.
 */
export async function closeDatabaseConnection() {
  if (cachedPrisma) {
    await cachedPrisma.$disconnect().catch(() => {});
    cachedPrisma = null;
  }
}
