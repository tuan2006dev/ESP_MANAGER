import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function cleanData() {
  console.log("🧹 Bắt đầu dọn dẹp dữ liệu thử nghiệm...");

  // 1. Xóa kết quả từng tuyển thủ
  await prisma.matchPlayerResult.deleteMany({});
  console.log("✓ Đã xóa MatchPlayerResults");

  // 2. Xóa kết quả trận đấu
  await prisma.matchResult.deleteMany({});
  console.log("✓ Đã xóa MatchResults");

  // 3. Xóa phân công nhiệm vụ
  await prisma.taskTeam.deleteMany({});
  console.log("✓ Đã xóa TaskTeams");

  // 4. Xóa danh sách nhiệm vụ / giải đấu
  await prisma.task.deleteMany({});
  console.log("✓ Đã xóa Tasks");

  // 5. Xóa Doanh thu
  await prisma.revenue.deleteMany({});
  console.log("✓ Đã xóa Revenues");

  // 6. Xóa Chi phí
  await prisma.expense.deleteMany({});
  console.log("✓ Đã xóa Expenses");

  // 7. Xóa Thưởng
  await prisma.bonus.deleteMany({});
  console.log("✓ Đã xóa Bonuses");

  // 8. Xóa Lương
  await prisma.salary.deleteMany({});
  console.log("✓ Đã xóa Salaries");

  // 9. Xóa Vi phạm
  await prisma.violation.deleteMany({});
  console.log("✓ Đã xóa Violations");

  // 10. Xóa Thông báo
  await prisma.notification.deleteMany({});
  console.log("✓ Đã xóa Notifications");

  // 11. Xóa Nhật ký hoạt động
  await prisma.activityLog.deleteMany({});
  console.log("✓ Đã xóa ActivityLogs");

  console.log("🎉 Hoàn tất dọn dẹp! Giữ nguyên tài khoản Admin, các Đội tuyển và danh sách Tuyển thủ.");
}

cleanData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
