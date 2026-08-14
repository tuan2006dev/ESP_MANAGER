"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createViolationSchema } from "@/lib/validations";
import { logActivity } from "./activity-log";
import { Severity, NotificationType } from "@prisma/client";

export async function createViolation(formData: {
  teamId: string;
  teamMemberId?: string;
  description: string;
  severity: "WARNING" | "MINOR" | "MAJOR" | "CRITICAL";
  proof?: string;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }

  const parsed = createViolationSchema.parse(formData);

  const violation = await prisma.violation.create({
    data: {
      teamId: parsed.teamId,
      teamMemberId: parsed.teamMemberId || null,
      description: parsed.description,
      severity: parsed.severity as Severity,
      proof: parsed.proof || null,
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
  for (const member of violation.team.members) {
    await prisma.notification.create({
      data: {
        userId: member.userId,
        title: `Cảnh báo vi phạm [${parsed.severity}]`,
        message: `Đội của bạn bị ghi nhận vi phạm: ${parsed.description}`,
        type: NotificationType.VIOLATION_ISSUED,
      },
    });
  }

  await logActivity(
    session.user.id,
    "Ghi nhận vi phạm",
    `Vi phạm [${parsed.severity}] cho đội ${violation.team.name}: ${parsed.description}`
  );

  revalidatePath("/admin/violations");
  revalidatePath("/captain");
  return violation;
}

export async function deleteViolation(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }

  const violation = await prisma.violation.delete({
    where: { id },
    include: { team: true },
  });

  await logActivity(
    session.user.id,
    "Xóa bản ghi vi phạm",
    `Xóa vi phạm của đội ${violation.team.name}`
  );

  revalidatePath("/admin/violations");
  return violation;
}
