import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function grantCaptains() {
  try {
    // Make sure 'ego', 'egobao', 'rox' all have TEAM_CAPTAIN role
    await prisma.user.updateMany({
      where: {
        email: { in: ["ego", "egobao", "rox"] },
      },
      data: {
        role: "TEAM_CAPTAIN",
      },
    });

    console.log("Updated ego, egobao, and rox to TEAM_CAPTAIN successfully!");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

grantCaptains();
