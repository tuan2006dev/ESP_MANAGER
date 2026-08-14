import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        teamMembers: {
          include: {
            team: true,
          },
        },
      },
    });

    console.log("=== DANH SÁCH TÀI KHOẢN HIỆN CÓ ===");
    for (const u of users) {
      const match = u.password ? await bcrypt.compare("1", u.password) : false;
      const teamName = u.teamMembers?.[0]?.team?.name ?? "N/A";
      const memberRole = u.teamMembers?.[0]?.role ?? "N/A";
      console.log(`- Tên: ${u.name} | Username/Email: ${u.email} | User.Role: ${u.role} | Team: ${teamName} (TeamMember.Role: ${memberRole}) | Pass là '1': ${match}`);
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkUsers();
