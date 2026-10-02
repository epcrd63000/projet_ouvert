const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.project.findFirst().then(console.log).finally(() => p.$disconnect());
