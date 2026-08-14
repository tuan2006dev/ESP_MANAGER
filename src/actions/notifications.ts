"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { NotificationType } from "@prisma/client";

export async function sendNotification({
  userId,
  teamId,
  title,
  message,
}: {
  userId?: string;
  teamId?: string;
  title: string;
  message: string;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }

  if (userId) {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: NotificationType.GENERAL,
      },
    });
  } else if (teamId) {
    const members = await prisma.teamMember.findMany({
      where: { teamId, isActive: true },
    });
    for (const m of members) {
      await prisma.notification.create({
        data: {
          userId: m.userId,
          title,
          message,
          type: NotificationType.GENERAL,
        },
      });
    }
  } else {
    // Send to all users
    const users = await prisma.user.findMany();
    for (const u of users) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          title,
          message,
          type: NotificationType.GENERAL,
        },
      });
    }
  }

  revalidatePath("/admin/notifications");
  revalidatePath("/captain");
  revalidatePath("/dashboard");
}

export async function markNotificationAsRead(id: string) {
  const session = await auth();
  if (!session) throw new Error("Chưa đăng nhập");

  await prisma.notification.update({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });

  revalidatePath("/admin/notifications");
  revalidatePath("/captain");
  revalidatePath("/dashboard");
}

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session) throw new Error("Chưa đăng nhập");

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/admin/notifications");
  revalidatePath("/captain");
  revalidatePath("/dashboard");
}
