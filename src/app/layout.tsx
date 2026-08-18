import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/providers/auth-provider";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { IpTracker } from "@/components/ip-tracker";
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ESP Manager - Quản lý Đội Esports",
  description:
    "Hệ thống quản lý đội tuyển Esports nội bộ - Quản lý đội, nhiệm vụ, báo cáo kết quả, thống kê và tài chính.",
  keywords: ["esports", "team management", "gaming", "tournament"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "Unknown IP";
  
  let isBanned = false;
  if (ip !== "Unknown IP") {
    const banned = await prisma.bannedIP.findUnique({
      where: { ip }
    });
    if (banned) {
      isBanned = true;
    }
  }

  if (isBanned) {
    return (
      <html lang="vi" className="dark">
        <body className={`${inter.variable} font-sans antialiased flex items-center justify-center min-h-screen bg-black text-white`}>
          <div className="text-center p-8 border border-red-500/50 bg-red-950/20 rounded-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Truy cập bị từ chối</h1>
            <p className="text-zinc-400">Địa chỉ IP của bạn đã bị cấm truy cập vào hệ thống. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là sự nhầm lẫn.</p>
            <p className="mt-4 text-sm text-zinc-600">IP của bạn: {ip}</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="vi" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <TooltipProvider>
            <IpTracker />
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
