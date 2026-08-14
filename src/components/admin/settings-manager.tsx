"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSystemSettings } from "@/actions/settings";
import { toast } from "sonner";

interface SettingsManagerProps {
  settings: Record<string, string>;
}

export function SettingsManager({ settings }: SettingsManagerProps) {
  const [orgName, setOrgName] = useState(settings["org_name"] || "Esports Organization");
  const [targetWinrate, setTargetWinrate] = useState(settings["target_winrate"] || "70");
  const [evalExcellent, setEvalExcellent] = useState(settings["eval_excellent"] || "70");
  const [evalImprove, setEvalImprove] = useState(settings["eval_improve"] || "50");
  const [currency, setCurrency] = useState(settings["currency"] || "VND");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSystemSettings({
        org_name: orgName,
        target_winrate: targetWinrate,
        eval_excellent: evalExcellent,
        eval_improve: evalImprove,
        currency,
      });
      toast.success("Đã lưu cài đặt hệ thống thành công!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi lưu cài đặt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Cài đặt Hệ thống</h1>
        <p className="text-sm text-muted-foreground">
          Cấu hình mục tiêu hiệu suất, quy chuẩn đánh giá và thông tin tổ chức
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Thông tin Tổ chức</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="org-name">Tên Tổ chức Esports</Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="currency">Đơn vị tiền tệ</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">
              Tiêu chuẩn Đánh giá Hiệu suất Đội tuyển (KPI)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="winrate-target">Winrate Mục tiêu BTC đặt ra (%)</Label>
              <Input
                id="winrate-target"
                type="number"
                min={1}
                max={100}
                value={targetWinrate}
                onChange={(e) => setTargetWinrate(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tỷ lệ thắng mục tiêu để đội được đánh giá hoàn thành xuất sắc nhiệm vụ (mặc định: 70%).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <Label htmlFor="eval-exc">Ngưỡng ĐẠT (Winrate &gt;= %)</Label>
                <Input
                  id="eval-exc"
                  type="number"
                  min={1}
                  max={100}
                  value={evalExcellent}
                  onChange={(e) => setEvalExcellent(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="eval-imp">Ngưỡng CẦN CẢI THIỆN (&gt;= %)</Label>
                <Input
                  id="eval-imp"
                  type="number"
                  min={1}
                  max={100}
                  value={evalImprove}
                  onChange={(e) => setEvalImprove(e.target.value)}
                  required
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Dưới ngưỡng Cần Cải Thiện sẽ tự động được đánh dấu là <strong>KHÔNG ĐẠT</strong> để BTC theo dõi và đưa ra quyết định.
            </p>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full glow-primary">
          {loading ? "Đang lưu..." : "Lưu tất cả Cài đặt"}
        </Button>
      </form>
    </div>
  );
}
