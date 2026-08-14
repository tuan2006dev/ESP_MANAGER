"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitCallback = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Đăng nhập thất bại", {
          description: "Tài khoản hoặc mật khẩu không đúng.",
        });
      } else {
        toast.success("Đăng nhập thành công!");
        if (explicitCallback) {
          router.push(explicitCallback);
        } else if (email === "admin") {
          router.push("/admin");
        } else if (email === "rox" || email === "egobao" || email === "ego" || email.includes("captain")) {
          router.push("/captain");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-4 glass border-border/30 animate-fade-in relative z-10">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 glow-primary pulse-glow">
            <Shield className="h-7 w-7 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold gradient-text">ESP Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hệ thống Quản lý Đội Esports Nội bộ
        </p>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Tài khoản / Email
            </Label>
            <Input
              id="email"
              type="text"
              placeholder="admin, rox, ego..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-input/50 border-border/50 focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Mật khẩu
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-input/50 border-border/50 focus:border-primary/50 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 hover:glow-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-border/30">
          <p className="text-[11px] text-muted-foreground text-center">
            Hệ thống dành cho thành viên tổ chức.
            <br />
            Liên hệ BTC nếu bạn chưa có tài khoản.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
