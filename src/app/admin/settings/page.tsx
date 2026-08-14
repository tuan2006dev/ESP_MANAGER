import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsManager } from "@/components/admin/settings-manager";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const settingsList = await prisma.systemSetting.findMany();
  const settingsMap: Record<string, string> = {};
  for (const s of settingsList) {
    settingsMap[s.key] = s.value;
  }

  return <SettingsManager settings={settingsMap} />;
}
