"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createTaskSchema } from "@/lib/validations";
import { logActivity } from "./activity-log";
import { TaskStatus, NotificationType } from "@prisma/client";

export async function createTask(formData: {
  name: string;
  description?: string;
  date: string;
  time?: string;
  map?: string;
  roomId?: string;
  roomPassword?: string;
  requirements?: string;
  entryFee?: number;
  teamIds: string[];
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện hành động này");
  }

  const parsed = createTaskSchema.parse(formData);

  const task = await prisma.task.create({
    data: {
      name: parsed.name,
      description: parsed.description || null,
      date: new Date(parsed.date),
      time: parsed.time || null,
      map: parsed.map || null,
      roomId: parsed.roomId || null,
      roomPassword: parsed.roomPassword || null,
      requirements: parsed.requirements || null,
      entryFee: parsed.entryFee || 0,
      taskTeams: {
        create: parsed.teamIds.map((teamId) => ({
          teamId,
          status: TaskStatus.PENDING,
        })),
      },
    },
    include: {
      taskTeams: {
        include: {
          team: {
            include: {
              members: {
                where: { isActive: true },
                include: { user: true },
              },
            },
          },
        },
      },
    },
  });

  // If entryFee > 0, record an Expense for each participating team
  if (parsed.entryFee && parsed.entryFee > 0) {
    for (const teamId of parsed.teamIds) {
      await prisma.expense.create({
        data: {
          teamId,
          amount: parsed.entryFee,
          category: "ENTRY_FEE",
          date: new Date(parsed.date),
          note: `Tiền đăng ký / Slot giải: ${parsed.name}`,
        },
      });
    }
  }

  // Notify team members/captains
  for (const tt of task.taskTeams) {
    for (const member of tt.team.members) {
      await prisma.notification.create({
        data: {
          userId: member.userId,
          title: "Nhiệm vụ mới được giao",
          message: `Đội của bạn được giao nhiệm vụ: ${task.name} vào ngày ${new Date(task.date).toLocaleDateString("vi-VN")}${parsed.entryFee ? ` (Phí đăng ký: ${parsed.entryFee.toLocaleString("vi-VN")}đ)` : ""}`,
          type: NotificationType.TASK_ASSIGNED,
        },
      });
    }
  }

  await logActivity(
    session.user.id,
    "Tạo nhiệm vụ mới",
    `Đã tạo nhiệm vụ ${task.name} và giao cho ${parsed.teamIds.length} đội (Phí slot: ${parsed.entryFee || 0}đ)`
  );

  revalidatePath("/admin/tasks");
  revalidatePath("/admin/finance");
  revalidatePath("/captain");
  revalidatePath("/dashboard");
  return task;
}

export async function updateTask(
  id: string,
  data: {
    name: string;
    description?: string;
    date: string;
    time?: string;
    map?: string;
    roomId?: string;
    roomPassword?: string;
    requirements?: string;
    entryFee?: number;
    teamIds?: string[];
  }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện hành động này");
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      date: new Date(data.date),
      time: data.time || null,
      map: data.map || null,
      roomId: data.roomId || null,
      roomPassword: data.roomPassword || null,
      requirements: data.requirements || null,
      entryFee: data.entryFee !== undefined ? data.entryFee : undefined,
    },
  });

  if (data.teamIds && data.teamIds.length > 0) {
    // Add new teams if not already assigned
    for (const teamId of data.teamIds) {
      await prisma.taskTeam.upsert({
        where: {
          taskId_teamId: {
            taskId: id,
            teamId,
          },
        },
        update: {},
        create: {
          taskId: id,
          teamId,
          status: TaskStatus.PENDING,
        },
      });
    }
  }

  await logActivity(
    session.user.id,
    "Cập nhật nhiệm vụ",
    `Đã cập nhật thông tin nhiệm vụ ${task.name}`
  );

  revalidatePath("/admin/tasks");
  revalidatePath(`/admin/tasks/${id}`);
  revalidatePath("/captain");
  return task;
}

export async function deleteTask(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện hành động này");
  }

  const task = await prisma.task.delete({
    where: { id },
  });

  await logActivity(
    session.user.id,
    "Xóa nhiệm vụ",
    `Đã xóa nhiệm vụ ${task.name}`
  );

  revalidatePath("/admin/tasks");
  revalidatePath("/captain");
  return task;
}

export async function updateTaskTeamStatus(
  taskTeamId: string,
  status: TaskStatus
) {
  const session = await auth();
  if (!session) {
    throw new Error("Chưa đăng nhập");
  }

  const taskTeam = await prisma.taskTeam.findUnique({
    where: { id: taskTeamId },
    include: {
      team: {
        include: {
          members: { where: { userId: session.user.id } },
        },
      },
      task: true,
    },
  });

  if (!taskTeam) {
    throw new Error("Không tìm thấy nhiệm vụ");
  }

  // Authorization check
  const isAdmin = session.user.role === "ADMIN";
  const isTeamMember = taskTeam.team.members.length > 0;
  const isCaptain = session.user.role === "TEAM_CAPTAIN" && isTeamMember;

  if (!isAdmin && !isCaptain) {
    throw new Error("Bạn không có quyền cập nhật trạng thái nhiệm vụ này");
  }

  // Captains can only transition from PENDING -> ACCEPTED -> IN_PROGRESS
  if (!isAdmin && !["ACCEPTED", "IN_PROGRESS"].includes(status)) {
    throw new Error("Đội trưởng chỉ có thể nhận hoặc bắt đầu nhiệm vụ");
  }

  const updated = await prisma.taskTeam.update({
    where: { id: taskTeamId },
    data: { status },
  });

  await logActivity(
    session.user.id,
    isAdmin ? "Admin đổi trạng thái nhiệm vụ" : "Đội nhận nhiệm vụ",
    `Nhiệm vụ ${taskTeam.task.name} của đội ${taskTeam.team.name} -> ${status}`
  );

  revalidatePath("/admin/tasks");
  revalidatePath("/captain");
  return updated;
}
