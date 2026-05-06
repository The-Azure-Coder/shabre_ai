import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadLocalEnv } from "./env.js";

loadLocalEnv();

const globalKey = "__smartreview_prisma__";

if (!globalThis[globalKey]) {
  const adapter = new PrismaPg(process.env.DATABASE_URL);
  globalThis[globalKey] = new PrismaClient({ adapter });
}

export const prisma = globalThis[globalKey];

export async function resetStoreForTests() {
  await prisma.review.deleteMany();
  await prisma.job.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();
}
