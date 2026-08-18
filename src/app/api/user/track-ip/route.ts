import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lấy IP từ headers (thường hoạt động tốt khi deploy qua reverse proxy như Vercel, Nginx)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "Unknown IP";

    if (ip === "Unknown IP") {
      return NextResponse.json({ message: "IP not found" });
    }

    // Upsert UserIP
    await prisma.userIP.upsert({
      where: {
        userId_ip: {
          userId: session.user.id,
          ip: ip,
        },
      },
      update: {
        lastSeen: new Date(),
      },
      create: {
        userId: session.user.id,
        ip: ip,
      },
    });

    return NextResponse.json({ success: true, ip });
  } catch (error) {
    console.error("Error tracking IP:", error);
    return NextResponse.json(
      { error: "Failed to track IP" },
      { status: 500 }
    );
  }
}
