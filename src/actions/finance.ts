"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createRevenueSchema,
  createExpenseSchema,
  createSalarySchema,
  createBonusSchema,
  salaryPolicySchema,
} from "@/lib/validations";
import { logActivity } from "./activity-log";
import { PaymentStatus, NotificationType } from "@prisma/client";

// ============================================
// REVENUE
// ============================================

export async function createRevenue(formData: {
  teamId: string;
  amount: number;
  source: string;
  date: string;
  note?: string;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }

  const parsed = createRevenueSchema.parse(formData);

  const revenue = await prisma.revenue.create({
    data: {
      teamId: parsed.teamId,
      amount: parsed.amount,
      source: parsed.source,
      date: new Date(parsed.date),
      note: parsed.note || null,
    },
    include: { team: true },
  });

  await logActivity(
    session.user.id,
    "Thêm doanh thu",
    `Ghi nhận doanh thu ${parsed.amount.toLocaleString("vi-VN")} VND từ ${parsed.source} (Đội ${revenue.team.name})`
  );

  revalidatePath("/admin/finance");
  revalidatePath("/admin");
  return revenue;
}

export async function deleteRevenue(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }

  const revenue = await prisma.revenue.delete({
    where: { id },
  });

  await logActivity(
    session.user.id,
    "Xóa doanh thu",
    `Đã xóa khoản doanh thu ${revenue.amount.toLocaleString("vi-VN")} VND`
  );

  revalidatePath("/admin/finance");
  revalidatePath("/admin");
  return revenue;
}

// ============================================
// EXPENSE
// ============================================

export async function createExpense(formData: {
  teamId?: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }

  const parsed = createExpenseSchema.parse(formData);

  const expense = await prisma.expense.create({
    data: {
      teamId: parsed.teamId || null,
      amount: parsed.amount,
      category: parsed.category,
      date: new Date(parsed.date),
      note: parsed.note || null,
    },
  });

  await logActivity(
    session.user.id,
    "Thêm chi phí",
    `Ghi nhận chi phí ${parsed.amount.toLocaleString("vi-VN")} VND (${parsed.category})`
  );

  revalidatePath("/admin/finance");
  revalidatePath("/admin");
  return expense;
}

export async function deleteExpense(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }

  const expense = await prisma.expense.delete({
    where: { id },
  });

  await logActivity(
    session.user.id,
    "Xóa chi phí",
    `Đã xóa khoản chi phí ${expense.amount.toLocaleString("vi-VN")} VND`
  );

  revalidatePath("/admin/finance");
  revalidatePath("/admin");
  return expense;
}

// ============================================
// SALARY
// ============================================

export async function generateOrUpdateSalary(formData: {
  teamId: string;
  month: string;
  amount: number;
  status?: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  note?: string;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }

  const salary = await prisma.salary.upsert({
    where: {
      teamId_month: {
        teamId: formData.teamId,
        month: formData.month,
      },
    },
    update: {
      amount: formData.amount,
      status: formData.status as PaymentStatus || PaymentStatus.PENDING,
      note: formData.note || null,
    },
    create: {
      teamId: formData.teamId,
      month: formData.month,
      amount: formData.amount,
      status: formData.status as PaymentStatus || PaymentStatus.PENDING,
      note: formData.note || null,
    },
    include: { team: true },
  });

  await logActivity(
    session.user.id,
    "Cập nhật lương",
    `Ghi nhận lương tháng ${formData.month} cho đội ${salary.team.name}: ${formData.amount.toLocaleString("vi-VN")} VND (${salary.status})`
  );

  revalidatePath("/admin/salary");
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
  revalidatePath("/captain");
  return salary;
}

export async function updateSalaryStatus(
  salaryId: string,
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED"
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }

  const salary = await prisma.salary.update({
    where: { id: salaryId },
    data: { status: status as PaymentStatus },
    include: {
      team: {
        include: {
          members: { where: { isActive: true } },
        },
      },
    },
  });

  if (status === "PAID" || status === "APPROVED") {
    for (const member of salary.team.members) {
      await prisma.notification.create({
        data: {
          userId: member.userId,
          title: `Lương tháng ${salary.month} (${status === "PAID" ? "Đã thanh toán" : "Đã duyệt"})`,
          message: `Lương tháng ${salary.month} của đội bạn đã chuyển sang trạng thái: ${status}`,
          type: NotificationType.GENERAL,
        },
      });
    }
  }

  await logActivity(
    session.user.id,
    "Duyệt/Đổi trạng thái lương",
    `Lương tháng ${salary.month} của đội ${salary.team.name} -> ${status}`
  );

  revalidatePath("/admin/salary");
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
  return salary;
}

// ============================================
// BONUS
// ============================================

export async function createBonus(formData: {
  name: string;
  reason?: string;
  amount: number;
  month: string;
  teamId: string;
  teamMemberId?: string;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }

  const parsed = createBonusSchema.parse(formData);

  const bonus = await prisma.bonus.create({
    data: {
      name: parsed.name,
      reason: parsed.reason || null,
      amount: parsed.amount,
      month: parsed.month,
      teamId: parsed.teamId,
      teamMemberId: parsed.teamMemberId || null,
      status: PaymentStatus.PENDING,
    },
    include: {
      team: {
        include: {
          members: { where: { isActive: true } },
        },
      },
    },
  });

  // Notify team members
  for (const member of bonus.team.members) {
    await prisma.notification.create({
      data: {
        userId: member.userId,
        title: "Tổ chức khen thưởng mới! 🎉",
        message: `Đội bạn được thưởng: ${bonus.name} (${bonus.amount.toLocaleString("vi-VN")} VND)`,
        type: NotificationType.BONUS_AWARDED,
      },
    });
  }

  await logActivity(
    session.user.id,
    "Tạo khoản thưởng",
    `Thưởng "${bonus.name}" (${bonus.amount.toLocaleString("vi-VN")} VND) cho đội ${bonus.team.name}`
  );

  revalidatePath("/admin/bonus");
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
  revalidatePath("/captain");
  return bonus;
}

export async function updateBonusStatus(
  bonusId: string,
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED"
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }

  const bonus = await prisma.bonus.update({
    where: { id: bonusId },
    data: { status: status as PaymentStatus },
  });

  revalidatePath("/admin/bonus");
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
  return bonus;
}

export async function deleteBonus(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }

  const bonus = await prisma.bonus.delete({ where: { id } });

  revalidatePath("/admin/bonus");
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
  return bonus;
}

// ============================================
// SALARY POLICY
// ============================================

export async function updateSalaryPolicy(data: {
  id?: string;
  name: string;
  baseSalary: number;
  requirements?: string;
  minTasks?: number;
  minWinrate?: number;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }

  const policy = await prisma.salaryPolicy.upsert({
    where: { id: data.id || "default-policy" },
    update: {
      name: data.name,
      baseSalary: data.baseSalary,
      requirements: data.requirements || null,
      minTasks: data.minTasks || 0,
      minWinrate: data.minWinrate || 0,
    },
    create: {
      id: "default-policy",
      name: data.name,
      baseSalary: data.baseSalary,
      requirements: data.requirements || null,
      minTasks: data.minTasks || 0,
      minWinrate: data.minWinrate || 0,
    },
  });

  await logActivity(
    session.user.id,
    "Cập nhật chính sách lương",
    `Cơ bản: ${data.baseSalary.toLocaleString("vi-VN")} VND/người/tháng`
  );

  revalidatePath("/admin/salary");
  revalidatePath("/admin/settings");
  return policy;
}
