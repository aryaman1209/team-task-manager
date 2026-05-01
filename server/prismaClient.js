const { PrismaClient } = require('@prisma/client');

let prisma;

try {
  prisma = new PrismaClient();
} catch (e) {
  console.error("Prisma init failed:", e.message);
  prisma = null;
}

module.exports = prisma;