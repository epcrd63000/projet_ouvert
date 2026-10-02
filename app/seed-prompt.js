const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const content = `Voici la transcription de notre réunion. Peux-tu me générer un compte rendu formaté en Markdown (sans en-tête de code Markdown, juste le texte) avec cette structure exacte :

# Compte-Rendu de Réunion : {meeting.title}

## 1. 📅 Informations
- **Date :** {meeting.date}
- **Objectif :** [Résumer l'objectif en une phrase]
- **Participants présents :** {meeting.attendees}

## 2. 📝 Points clés abordés
[Lister sous forme de puces les sujets principaux discutés]

## 3. ✅ Décisions actées
[Lister de façon claire et concise les décisions finales prises]

## 4. 🎯 Prochaines étapes
[Sous forme de tirets : Qui fait quoi pour quand]

Voici la transcription brute :
`;

async function main() {
  await prisma.aiPrompt.create({
    data: {
      title: 'Modèle de Compte Rendu (Réunion)',
      content: content
    }
  });
  console.log('Inserted default prompt.');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
