"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function banTeamIps(teamId: string, reason?: string) {
  try {
    // Lấy tất cả userIDs của các thành viên trong đội
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });

    const userIds = teamMembers.map((m) => m.userId);

    // Lấy tất cả IPs mà những người này đã sử dụng
    const userIps = await prisma.userIP.findMany({
      where: { userId: { in: userIds } },
      select: { ip: true },
    });

    const ipsToBan = [...new Set(userIps.map((u) => u.ip))];

    // Thêm các IP này vào BannedIP
    for (const ip of ipsToBan) {
      await prisma.bannedIP.upsert({
        where: { ip },
        update: { reason: reason || `Ban team ${teamId}` },
        create: { ip, reason: reason || `Ban team ${teamId}` },
      });
    }

    // Đổi trạng thái đội thành SUSPENDED
    await prisma.team.update({
      where: { id: teamId },
      data: { status: "SUSPENDED" },
    });

    revalidatePath("/dashboard/settings/ip-logs");
    revalidatePath("/dashboard/teams");
    return { success: true };
  } catch (error: any) {
    console.error("Error banning team IPs:", error);
    return { error: error.message || "Failed to ban team IPs" };
  }
}

export async function banIp(ip: string, reason?: string) {
  try {
    await prisma.bannedIP.upsert({
      where: { ip },
      update: { reason },
      create: { ip, reason },
    });
    revalidatePath("/dashboard/settings/ip-logs");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to ban IP" };
  }
}

export async function unbanIp(ip: string) {
  try {
    await prisma.bannedIP.delete({
      where: { ip },
    });
    revalidatePath("/dashboard/settings/ip-logs");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to unban IP" };
  }
}
