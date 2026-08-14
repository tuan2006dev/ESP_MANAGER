"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity-log";

export async function updateSystemSettings(settings: Record<string, string>) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }

  for (const [key, value] of Object.entries(settings)) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  await logActivity(
    session.user.id,
    "Cập nhật cài đặt hệ thống",
    `Đã lưu cấu hình hệ thống`
  );

  revalidatePath("/admin/settings");
  revalidatePath("/admin/ranking");
  revalidatePath("/admin");
}
