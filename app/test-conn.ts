import { PrismaClient } from "@prisma/client";

async function test() {
  const directUrl = process.env.DIRECT_URL;
  const dbUrl = process.env.DATABASE_URL;
  console.log("Testing DIRECT_URL:", directUrl);
  const prismaDirect = new PrismaClient({ datasources: { db: { url: directUrl } } });
  try {
    const res = await prismaDirect.$queryRaw`SELECT 1 as val`;
    console.log("Direct connection success:", res);
  } catch (e: any) {
    console.error("Direct connection failed:", e.message);
  } finally {
    await prismaDirect.$disconnect();
  }

  console.log("\nTesting DATABASE_URL:", dbUrl);
  const prismaPooler = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  try {
    const res2 = await prismaPooler.$queryRaw`SELECT 1 as val`;
    console.log("Pooler connection success:", res2);
  } catch (e: any) {
    console.error("Pooler connection failed:", e.message);
  } finally {
    await prismaPooler.$disconnect();
  }
}

test();
