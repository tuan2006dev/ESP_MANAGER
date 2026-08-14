import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database with exact rosters and updated accounts...");

  const defaultPassword = await bcrypt.hash("1", 12);

  // 1. Admin User
  await prisma.user.upsert({
    where: { email: "admin" },
    update: { name: "Admin BTC", password: defaultPassword, role: Role.ADMIN },
    create: {
      name: "Admin BTC",
      email: "admin",
      password: defaultPassword,
      role: Role.ADMIN,
    },
  });
  console.log("✅ Admin verified (tk: admin / mk: 1)");

  // 2. Teams
  const roxTeam = await prisma.team.upsert({
    where: { name: "ROX ESP" },
    update: {},
    create: {
      name: "ROX ESP",
      status: "ACTIVE",
    },
  });

  const egoTeam = await prisma.team.upsert({
    where: { name: "EGO ESP" },
    update: {},
    create: {
      name: "EGO ESP",
      status: "ACTIVE",
    },
  });

  // Clean old members of these teams to set exact rosters
  await prisma.teamMember.deleteMany({
    where: { teamId: { in: [roxTeam.id, egoTeam.id] } },
  });

  // 3. EGO ESP Roster
  // Captain: Chảo Phùng Vạn (At.Pvan)
  const egoCapUser = await prisma.user.upsert({
    where: { email: "ego" },
    update: { name: "Chảo Phùng Vạn", password: defaultPassword, role: Role.TEAM_CAPTAIN },
    create: {
      name: "Chảo Phùng Vạn",
      email: "ego",
      password: defaultPassword,
      role: Role.TEAM_CAPTAIN,
    },
  });
  await prisma.teamMember.create({
    data: {
      teamId: egoTeam.id,
      userId: egoCapUser.id,
      nickname: "At.Pvan",
      gameUid: "EGO_PVAN",
    },
  });

  // EGO Members:
  const egoMembersData = [
    { name: "Long", email: "egolong", nickname: "woaw.long", gameUid: "EGO_LONG" },
    { name: "Bảo", email: "egobao", nickname: "Zeus.vn⁴⁴⁴", gameUid: "EGO_BAO" },
    { name: "Lợi", email: "egoloi", nickname: "PLOI Dz~", gameUid: "EGO_LOI" },
  ];

  for (const m of egoMembersData) {
    const u = await prisma.user.upsert({
      where: { email: m.email },
      update: { name: m.name, password: defaultPassword, role: Role.MEMBER },
      create: {
        name: m.name,
        email: m.email,
        password: defaultPassword,
        role: Role.MEMBER,
      },
    });
    await prisma.teamMember.create({
      data: {
        teamId: egoTeam.id,
        userId: u.id,
        nickname: m.nickname,
        gameUid: m.gameUid,
      },
    });
  }
  console.log("✅ EGO ESP Roster updated (Chảo Phùng Vạn, Long, Bảo, Lợi)");

  // 4. ROX ESP Roster
  // Captain: Huỳnh Mai Anh (An Giang 67)
  const roxCapUser = await prisma.user.upsert({
    where: { email: "rox" },
    update: { name: "Huỳnh Mai Anh", password: defaultPassword, role: Role.TEAM_CAPTAIN },
    create: {
      name: "Huỳnh Mai Anh",
      email: "rox",
      password: defaultPassword,
      role: Role.TEAM_CAPTAIN,
    },
  });
  await prisma.teamMember.create({
    data: {
      teamId: roxTeam.id,
      userId: roxCapUser.id,
      nickname: "An Giang 67",
      gameUid: "ROX_MAIANH",
    },
  });

  // ROX Members:
  const roxMembersData = [
    { name: "Trần Hồ Nhựt Long", email: "roxlong", nickname: "DFG丶longgg", gameUid: "ROX_LONG" },
    { name: "Nguyễn Huy Phong", email: "roxphong", nickname: "ɴo ʟovᴇ?", gameUid: "ROX_PHONG" },
    { name: "Nguyễn Đăng Khôi", email: "roxkhoi", nickname: "㊎ᵏʰôᶦ┊ᵐᵉᵏᶦᶦϟ", gameUid: "ROX_KHOI" },
    { name: "Trần Nhựt Quang", email: "roxquang", nickname: "K12 kid lỏ", gameUid: "ROX_QUANG" },
  ];

  for (const m of roxMembersData) {
    const u = await prisma.user.upsert({
      where: { email: m.email },
      update: { name: m.name, password: defaultPassword, role: Role.MEMBER },
      create: {
        name: m.name,
        email: m.email,
        password: defaultPassword,
        role: Role.MEMBER,
      },
    });
    await prisma.teamMember.create({
      data: {
        teamId: roxTeam.id,
        userId: u.id,
        nickname: m.nickname,
        gameUid: m.gameUid,
      },
    });
  }
  console.log("✅ ROX ESP Roster updated (Huỳnh Mai Anh, Trần Hồ Nhựt Long, Nguyễn Huy Phong, Nguyễn Đăng Khôi, Trần Nhựt Quang)");

  // 5. Salary Policy
  await prisma.salaryPolicy.upsert({
    where: { id: "default-policy" },
    update: {},
    create: {
      id: "default-policy",
      name: "Chính sách lương tiêu chuẩn",
      baseSalary: 2000000,
      currency: "VND",
      requirements: "Hoàn thành đủ các nhiệm vụ được BTC giao trong tháng.",
      minTasks: 1,
      minWinrate: 50,
    },
  });

  // 6. System Settings
  const settings = [
    { key: "org_name", value: "Esports Organization" },
    { key: "target_winrate", value: "70" },
    { key: "eval_excellent", value: "70" },
    { key: "eval_improve", value: "50" },
    { key: "currency", value: "VND" },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log("\n🎉 Seed update completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
