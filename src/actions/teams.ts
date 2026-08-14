"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createTeamSchema, addMemberSchema } from "@/lib/validations";
import { logActivity } from "./activity-log";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function createTeam(formData: { name: string; logo?: string }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện hành động này");
  }

  const parsed = createTeamSchema.parse(formData);

  const team = await prisma.team.create({
    data: {
      name: parsed.name,
      logo: parsed.logo || null,
    },
  });

  await logActivity(
    session.user.id,
    "Tạo đội mới",
    `Đã tạo đội ${team.name}`
  );

  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  revalidatePath("/");
  return team;
}

export async function updateTeam(
  id: string,
  data: { name: string; logo?: string; status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện hành động này");
  }

  const team = await prisma.team.update({
    where: { id },
    data: {
      name: data.name,
      logo: data.logo || null,
      status: data.status,
    },
  });

  await logActivity(
    session.user.id,
    "Cập nhật thông tin đội",
    `Đã cập nhật đội ${team.name}`
  );

  revalidatePath("/admin/teams");
  revalidatePath(`/admin/teams/${id}`);
  revalidatePath("/teams");
  revalidatePath("/");
  return team;
}

export async function deleteTeam(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện hành động này");
  }

  const team = await prisma.team.delete({
    where: { id },
  });

  await logActivity(
    session.user.id,
    "Xóa đội",
    `Đã xóa đội ${team.name}`
  );

  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  revalidatePath("/");
  return team;
}

export async function createMemberAndAssign({
  teamId,
  name,
  email,
  nickname,
  gameUid,
  isCaptain = false,
}: {
  teamId: string;
  name: string;
  email: string;
  nickname: string;
  gameUid?: string;
  isCaptain?: boolean;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện hành động này");
  }

  const defaultPassword = await bcrypt.hash("1", 12);

  // Check if user exists
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email,
        password: defaultPassword,
        role: isCaptain ? Role.TEAM_CAPTAIN : Role.MEMBER,
      },
    });
  } else if (isCaptain && user.role !== Role.ADMIN) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: Role.TEAM_CAPTAIN },
    });
  }

  const member = await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId,
        userId: user.id,
      },
    },
    update: {
      nickname,
      gameUid: gameUid || null,
      isActive: true,
    },
    create: {
      teamId,
      userId: user.id,
      nickname,
      gameUid: gameUid || null,
    },
  });

  await logActivity(
    session.user.id,
    "Thêm thành viên",
    `Đã thêm ${name} (${nickname}) vào đội`
  );

  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath("/admin/members");
  return member;
}

export async function updateMemberProfile({
  memberId,
  name,
  nickname,
  gameUid,
  teamId,
}: {
  memberId?: string;
  name: string;
  nickname: string;
  gameUid?: string;
  teamId?: string;
}) {
  const session = await auth();
  if (!session) {
    throw new Error("Chưa đăng nhập");
  }

  const isAdmin = session.user.role === "ADMIN";

  let targetMember;
  if (memberId && isAdmin) {
    targetMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });
  } else {
    // Current user's member profile
    targetMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id, isActive: true },
      include: { user: true },
    });
  }

  if (!targetMember) {
    throw new Error("Không tìm thấy thông tin thành viên");
  }

  // Update user name (Tên thật)
  await prisma.user.update({
    where: { id: targetMember.userId },
    data: { name },
  });

  // Update member nickname & gameUid (Tên game & UID)
  const updatedMember = await prisma.teamMember.update({
    where: { id: targetMember.id },
    data: {
      nickname,
      gameUid: gameUid || null,
      teamId: isAdmin && teamId ? teamId : targetMember.teamId,
    },
    include: { team: true, user: true },
  });

  await logActivity(
    session.user.id,
    "Cập nhật thông tin tuyển thủ",
    `Cập nhật: ${name} | Nickname game: ${nickname} | UID: ${gameUid || "—"}`
  );

  revalidatePath("/captain");
  revalidatePath("/dashboard");
  revalidatePath("/admin/members");
  revalidatePath(`/admin/teams/${updatedMember.teamId}`);
  revalidatePath("/");
  return updatedMember;
}

export async function removeTeamMember(memberId: string, teamId: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện hành động này");
  }

  const member = await prisma.teamMember.delete({
    where: { id: memberId },
    include: { user: true },
  });

  await logActivity(
    session.user.id,
    "Xóa thành viên khỏi đội",
    `Đã xóa ${member.nickname} khỏi đội`
  );

  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath("/admin/members");
  return member;
}

export async function setTeamCaptain(teamId: string, memberId: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện hành động này");
  }

  const targetMember = await prisma.teamMember.findUnique({
    where: { id: memberId },
    include: { user: true, team: true },
  });

  if (!targetMember || targetMember.teamId !== teamId) {
    throw new Error("Không tìm thấy thành viên trong đội này");
  }

  // Find all members in this team
  const allMembers = await prisma.teamMember.findMany({
    where: { teamId },
    include: { user: true },
  });

  // Set target member to TEAM_CAPTAIN, demote other captains in this team to MEMBER
  for (const m of allMembers) {
    if (m.id === memberId) {
      await prisma.user.update({
        where: { id: m.userId },
        data: { role: Role.TEAM_CAPTAIN },
      });
    } else if (m.user.role === Role.TEAM_CAPTAIN) {
      await prisma.user.update({
        where: { id: m.userId },
        data: { role: Role.MEMBER },
      });
    }
  }

  await logActivity(
    session.user.id,
    "Bổ nhiệm Đội trưởng",
    `Bổ nhiệm ${targetMember.nickname} (${targetMember.user.name}) làm Đội trưởng đội ${targetMember.team.name}`
  );

  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath("/admin/teams");
  revalidatePath("/admin/members");
  revalidatePath("/captain");
  revalidatePath("/dashboard");
  return { success: true };
}



