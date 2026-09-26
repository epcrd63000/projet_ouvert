import { defineConfig } from "@neon/config/v1";

// Configuration Neon pour le projet IMT Projet Ouvert
// Définition du bucket S3 privé pour les fichiers téléversés
export default defineConfig({
  preview: {
    buckets: {
      uploads: { access: "private" },
    },
  },
});
