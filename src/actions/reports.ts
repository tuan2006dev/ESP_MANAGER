"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { submitReportSchema } from "@/lib/validations";
import { logActivity } from "./activity-log";
import { TaskStatus, ResultType, NotificationType, Role } from "@prisma/client";

export async function submitMatchReport(formData: {
  taskTeamId: string;
  rank: number;
  totalKills: number;
  prizeMoney?: number;
  resultType: "WIN" | "TOP_2" | "TOP_3" | "TOP_5" | "TOP_10" | "OTHER";
  screenshot?: string;
  note?: string;
  playerResults?: { teamMemberId: string; kills: number }[];
}) {
  const session = await auth();
  if (!session) {
    throw new Error("Chưa đăng nhập");
  }

  const parsed = submitReportSchema.parse(formData);

  const taskTeam = await prisma.taskTeam.findUnique({
    where: { id: parsed.taskTeamId },
    include: {
      team: {
        include: {
          members: { where: { userId: session.user.id } },
        },
      },
      task: true,
      matchResult: true,
    },
  });

  if (!taskTeam) {
    throw new Error("Không tìm thấy nhiệm vụ");
  }

  // Authorization: Only admin or captain of the assigned team can submit
  const isAdmin = session.user.role === "ADMIN";
  const isCaptain =
    session.user.role === "TEAM_CAPTAIN" && taskTeam.team.members.length > 0;

  if (!isAdmin && !isCaptain) {
    throw new Error("Bạn không có quyền báo cáo cho nhiệm vụ này");
  }

  // If already approved, do not allow captain to overwrite
  if (taskTeam.matchResult?.approvedAt && !isAdmin) {
    throw new Error("Kết quả đã được BTC duyệt, không thể chỉnh sửa");
  }

  // Create or update match result
  const matchResult = await prisma.matchResult.upsert({
    where: { taskTeamId: parsed.taskTeamId },
    update: {
      rank: parsed.rank,
      totalKills: parsed.totalKills,
      resultType: parsed.resultType as ResultType,
      prizeMoney: parsed.prizeMoney || 0,
      screenshot: parsed.screenshot || null,
      note: parsed.note || null,
      submittedAt: new Date(),
      // Reset approval if re-submitted by captain
      approvedAt: null,
      approvedById: null,
    },
    create: {
      taskTeamId: parsed.taskTeamId,
      rank: parsed.rank,
      totalKills: parsed.totalKills,
      resultType: parsed.resultType as ResultType,
      prizeMoney: parsed.prizeMoney || 0,
      screenshot: parsed.screenshot || null,
      note: parsed.note || null,
    },
  });

  // Update player kills if provided
  if (parsed.playerResults && parsed.playerResults.length > 0) {
    for (const pr of parsed.playerResults) {
      await prisma.matchPlayerResult.upsert({
        where: {
          matchResultId_teamMemberId: {
            matchResultId: matchResult.id,
            teamMemberId: pr.teamMemberId,
          },
        },
        update: {
          kills: pr.kills,
        },
        create: {
          matchResultId: matchResult.id,
          teamMemberId: pr.teamMemberId,
          kills: pr.kills,
        },
      });
    }
  }

  // Update taskTeam status to COMPLETED
  await prisma.taskTeam.update({
    where: { id: parsed.taskTeamId },
    data: { status: TaskStatus.COMPLETED },
  });

  // Notify Admins
  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
  });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: "Báo cáo kết quả mới",
        message: `Đội ${taskTeam.team.name} đã gửi báo cáo cho nhiệm vụ ${taskTeam.task.name} (Hạng ${parsed.rank}, ${parsed.totalKills} Kills, Thưởng: ${parsed.prizeMoney?.toLocaleString("vi-VN") || 0}đ)`,
        type: NotificationType.GENERAL,
      },
    });
  }

  await logActivity(
    session.user.id,
    "Team Captain gửi report",
    `Đội ${taskTeam.team.name} gửi báo cáo nhiệm vụ ${taskTeam.task.name}: ${parsed.resultType}, Hạng ${parsed.rank}, ${parsed.totalKills} Kills, Thưởng ${parsed.prizeMoney || 0}đ`
  );

  revalidatePath("/admin/reports");
  revalidatePath("/admin/tasks");
  revalidatePath("/captain");
  return matchResult;
}

export async function approveMatchReport(
  matchResultId: string,
  options?: { prizeMoney?: number; note?: string }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền duyệt báo cáo");
  }

  const existing = await prisma.matchResult.findUnique({
    where: { id: matchResultId },
  });

  const finalPrizeMoney =
    options?.prizeMoney !== undefined
      ? options.prizeMoney
      : existing?.prizeMoney || 0;

  const result = await prisma.matchResult.update({
    where: { id: matchResultId },
    data: {
      prizeMoney: finalPrizeMoney,
      note: options?.note ? `${options.note}\n${existing?.note || ""}` : existing?.note,
      approvedAt: new Date(),
      approvedById: session.user.id,
    },
    include: {
      taskTeam: {
        include: {
          team: {
            include: {
              members: { where: { isActive: true } },
            },
          },
          task: true,
        },
      },
    },
  });

  // Automatically record as Team Revenue if prizeMoney > 0
  if (result.prizeMoney && result.prizeMoney > 0) {
    await prisma.revenue.create({
      data: {
        teamId: result.taskTeam.teamId,
        amount: result.prizeMoney,
        source: "TOURNAMENT",
        date: new Date(),
        note: `Tiền giải thưởng từ trận/giải: ${result.taskTeam.task.name} (Hạng #${result.rank})`,
      },
    });
  }

  // Update taskTeam status to APPROVED
  await prisma.taskTeam.update({
    where: { id: result.taskTeamId },
    data: { status: TaskStatus.APPROVED },
  });

  // Notify all members of the team
  for (const member of result.taskTeam.team.members) {
    await prisma.notification.create({
      data: {
        userId: member.userId,
        title: "Báo cáo đã được duyệt",
        message: `BTC đã duyệt kết quả nhiệm vụ ${result.taskTeam.task.name} của đội bạn! (Thưởng: ${result.prizeMoney?.toLocaleString("vi-VN") || 0}đ)`,
        type: NotificationType.REPORT_APPROVED,
      },
    });
  }

  await logActivity(
    session.user.id,
    "Admin duyệt report",
    `Duyệt kết quả nhiệm vụ ${result.taskTeam.task.name} của đội ${result.taskTeam.team.name}`
  );

  revalidatePath("/admin/reports");
  revalidatePath("/admin/tasks");
  revalidatePath("/admin/ranking");
  revalidatePath("/admin/finance");
  revalidatePath("/captain");
  revalidatePath("/dashboard");
  revalidatePath("/ranking");
  revalidatePath("/");
  return result;
}

export async function rejectMatchReport(matchResultId: string, reason?: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền từ chối báo cáo");
  }

  const result = await prisma.matchResult.findUnique({
    where: { id: matchResultId },
    include: {
      taskTeam: {
        include: {
          team: {
            include: {
              members: { where: { isActive: true } },
            },
          },
          task: true,
        },
      },
    },
  });

  if (!result) throw new Error("Không tìm thấy kết quả");

  // Update note with rejection reason
  await prisma.matchResult.update({
    where: { id: matchResultId },
    data: {
      note: reason ? `[Lý do từ chối]: ${reason}\n${result.note || ""}` : result.note,
      approvedAt: null,
      approvedById: null,
    },
  });

  // Update taskTeam status to REJECTED
  await prisma.taskTeam.update({
    where: { id: result.taskTeamId },
    data: { status: TaskStatus.REJECTED },
  });

  // Notify team members
  for (const member of result.taskTeam.team.members) {
    await prisma.notification.create({
      data: {
        userId: member.userId,
        title: "Báo cáo bị từ chối",
        message: `BTC đã từ chối báo cáo nhiệm vụ ${result.taskTeam.task.name}. ${reason ? `Lý do: ${reason}` : "Vui lòng kiểm tra lại."}`,
        type: NotificationType.REPORT_REJECTED,
      },
    });
  }

  await logActivity(
    session.user.id,
    "Admin từ chối report",
    `Từ chối báo cáo nhiệm vụ ${result.taskTeam.task.name} của đội ${result.taskTeam.team.name}`
  );

  revalidatePath("/admin/reports");
  revalidatePath("/admin/tasks");
  revalidatePath("/captain");
  return result;
}

export async function editMatchReport(
  matchResultId: string,
  data: {
    rank: number;
    totalKills: number;
    resultType: "WIN" | "TOP_2" | "TOP_3" | "TOP_5" | "TOP_10" | "OTHER";
    prizeMoney?: number;
    note?: string;
    playerResults?: { teamMemberId: string; kills: number }[];
  }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền chỉnh sửa kết quả");
  }

  const result = await prisma.matchResult.update({
    where: { id: matchResultId },
    data: {
      rank: data.rank,
      totalKills: data.totalKills,
      resultType: data.resultType as ResultType,
      prizeMoney: data.prizeMoney ?? 0,
      note: data.note || null,
    },
    include: {
      taskTeam: {
        include: {
          team: true,
          task: true,
        },
      },
    },
  });

  if (data.playerResults && data.playerResults.length > 0) {
    for (const pr of data.playerResults) {
      await prisma.matchPlayerResult.upsert({
        where: {
          matchResultId_teamMemberId: {
            matchResultId: matchResultId,
            teamMemberId: pr.teamMemberId,
          },
        },
        update: { kills: pr.kills },
        create: {
          matchResultId: matchResultId,
          teamMemberId: pr.teamMemberId,
          kills: pr.kills,
        },
      });
    }
  }

  await logActivity(
    session.user.id,
    "Admin sửa thông tin",
    `Sửa kết quả nhiệm vụ ${result.taskTeam.task.name} của đội ${result.taskTeam.team.name}`
  );

  revalidatePath("/admin/reports");
  revalidatePath("/admin/ranking");
  revalidatePath("/ranking");
  revalidatePath("/");
  return result;
}
