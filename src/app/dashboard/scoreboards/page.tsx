"use client";

import { useEffect, useState } from "react";
import { findGarenaMatches, getGarenaMatchDetails } from "@/actions/garena";
import { getCatalog, getKeys, createScoreboard } from "@/actions/vmnghia";
import { 
  Trophy, 
  Clock, 
  Search, 
  Loader2, 
  Zap, 
  Flame, 
  Users, 
  Crosshair, 
  Medal, 
  Sparkles,
  Settings2,
  Calendar,
  Layers,
  CheckSquare,
  Square,
  Crown,
  ImageIcon,
  X,
  Smartphone,
  Download,
  Ban,
  RotateCcw,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface MatchItem {
  id: string;
  startTime: number;
  endTime: number;
}

interface RankItem {
  rank: number;
  accountNames: string[];
  playerAccountIds: string[];
  booyah: number;
  kill: number;
  score: number;
  teamName: string;
}

interface AggregatedTeam {
  teamKey: string;
  teamName: string;
  accountNames: string[];
  playerAccountIds: string[];
  matchScores: { [matchId: string]: { score: number; kill: number; booyah: number; rank: number } };
  totalBooyah: number;
  totalKill: number;
  totalScore: number;
  finalRank: number;
  // CPR tracking
  cprReachedAtMatch?: number; // Trận mà đội chạm mốc CPR
  isCprChampion?: boolean;    // Đội đã chạm mốc CPR và thắng Booyah ở trận sau
  cprWinMatchIndex?: number;  // Trận mà đội thắng Booyah sau khi có CPR
}

// 24h Time options for dropdowns (every 30 mins)
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  const str = `${String(hour).padStart(2, "0")}:${min}`;
  return { value: str, label: str };
});

export default function ScoreboardsPage() {
  // Tabs
  const [activeTab, setActiveTab] = useState("garena");

  // Garena Account & Time State
  const [accountId, setAccountId] = useState("7476037837");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("23:59");

  const [customCookie, setCustomCookie] = useState("");
  const [showCookieSetting, setShowCookieSetting] = useState(false);
  const [searchingMatches, setSearchingMatches] = useState(false);
  const [matches, setMatches] = useState<MatchItem[]>([]);

  // Hủy trận / Xóa trận lỗi (Remake match removal)
  const [cancelledMatchIds, setCancelledMatchIds] = useState<string[]>([]);
  const [removeMatchInput, setRemoveMatchInput] = useState("");

  // Mode: Single Match vs Multi Match (4 matches / 5 matches CPR)
  const [viewMode, setViewMode] = useState<"single" | "multi">("single");
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [selectedSingleMatchId, setSelectedSingleMatchId] = useState<string | null>(null);
  
  // Single match state
  const [loadingMatchDetails, setLoadingMatchDetails] = useState(false);
  const [ranks, setRanks] = useState<RankItem[]>([]);
  const [showNames, setShowNames] = useState(true);

  // Multi-match aggregated state & CPR
  const [loadingMultiMatches, setLoadingMultiMatches] = useState(false);
  const [aggregatedTeams, setAggregatedTeams] = useState<AggregatedTeam[]>([]);
  const [cprThreshold, setCprThreshold] = useState<number>(80); // Mốc CPR tùy chỉnh
  const [cprEnabled, setCprEnabled] = useState<boolean>(false);
  const [cprThresholdInput, setCprThresholdInput] = useState<string>("80");
  const [exportingPng, setExportingPng] = useState(false);

  // Mobile Image Preview Modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState("");

  // Vmnghia State
  const [catalog, setCatalog] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [loadingVmnghia, setLoadingVmnghia] = useState(false);
  const [submittingVmnghia, setSubmittingVmnghia] = useState(false);
  const [vmnghiaResultImage, setVmnghiaResultImage] = useState<string | null>(null);
  const [vmnghiaForm, setVmnghiaForm] = useState({
    scoreboardTypeId: "",
    keyId: "",
    idGame: "",
    timeStart: "",
    timeEnd: "",
    matchRemoval: "0",
    cpr: "0",
  });

  // Default date setup (Today)
  useEffect(() => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    
    const past = new Date();
    past.setDate(past.getDate() - 14);
    const pastStr = `${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}`;

    setStartDate(pastStr);
    setEndDate(todayStr);
    setStartTime("00:00");
    setEndTime("23:59");

    if (typeof window !== "undefined") {
      const savedCookie = localStorage.getItem("garena_session_cookie");
      if (savedCookie) setCustomCookie(savedCookie);
    }
  }, []);

  const handleCookieChange = (val: string) => {
    setCustomCookie(val);
    if (typeof window !== "undefined") {
      if (val.trim()) {
        localStorage.setItem("garena_session_cookie", val.trim());
      } else {
        localStorage.removeItem("garena_session_cookie");
      }
    }
  };

  // Handle finding Garena Matches
  const handleFindMatches = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!accountId || !startDate || !endDate || !startTime || !endTime) {
      toast.error("Vui lòng điền đầy đủ Account ID, Ngày và Giờ!");
      return;
    }

    const startDateTime = `${startDate}T${startTime}:00`;
    const endDateTime = `${endDate}T${endTime}:59`;

    const startTimestamp = Math.floor(new Date(startDateTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDateTime).getTime() / 1000);

    if (isNaN(startTimestamp) || isNaN(endTimestamp)) {
      toast.error("Định dạng ngày giờ không hợp lệ!");
      return;
    }

    setSearchingMatches(true);
    setMatches([]);
    setCancelledMatchIds([]);
    setRanks([]);
    setAggregatedTeams([]);
    setSelectedSingleMatchId(null);
    setSelectedMatchIds([]);

    try {
      const res = await findGarenaMatches({
        accountId,
        startTime: startTimestamp,
        endTime: endTimestamp,
        cookie: customCookie || undefined,
      });

      if (res.success && res.matches) {
        setMatches(res.matches);
        if (res.matches.length === 0) {
          toast.info("Không tìm thấy trận đấu nào trong khoảng thời gian này.");
        } else {
          toast.success(`Tìm thấy ${res.matches.length} trận đấu!`);
          handleSelectSingleMatch(res.matches[0].id);
        }
      } else {
        toast.error(res.error || "Lỗi tìm kiếm trận đấu.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ Garena.");
    } finally {
      setSearchingMatches(false);
    }
  };

  // Toggle Hủy trận / Bỏ trận lỗi
  const handleToggleCancelMatch = (matchId: string) => {
    setCancelledMatchIds(prev => {
      const isCancelled = prev.includes(matchId);
      const next = isCancelled ? prev.filter(id => id !== matchId) : [...prev, matchId];
      
      // Auto remove from multi-match selection if cancelled
      if (!isCancelled) {
        setSelectedMatchIds(old => {
          const updated = old.filter(id => id !== matchId);
          if (updated.length > 0) {
            aggregateMultipleMatches(updated);
          }
          return updated;
        });
        toast.info("Đã bỏ trận lỗi này khỏi danh sách tính điểm.");
      } else {
        toast.success("Đã khôi phục lại trận đấu.");
      }
      return next;
    });
  };

  // Quick Remove Match from input (VD: nhập "3" để bỏ trận 3)
  const handleApplyRemoveMatch = () => {
    const matchNum = parseInt(removeMatchInput.trim(), 10);
    if (isNaN(matchNum) || matchNum < 1 || matchNum > matches.length) {
      toast.error(`Vui lòng nhập số trận hợp lệ từ 1 đến ${matches.length}`);
      return;
    }
    const targetMatch = matches[matchNum - 1];
    if (targetMatch) {
      handleToggleCancelMatch(targetMatch.id);
      setRemoveMatchInput("");
    }
  };

  // Select Single Match (Max 12 Teams)
  const handleSelectSingleMatch = async (matchId: string) => {
    setViewMode("single");
    setSelectedSingleMatchId(matchId);
    setLoadingMatchDetails(true);

    try {
      const res = await getGarenaMatchDetails({
        matchId,
        cookie: customCookie || undefined,
      });

      if (res.success && res.match?.ranks) {
        const valid12 = (res.match.ranks as RankItem[]).slice(0, 12);
        setRanks(valid12);
        toast.success(`Đã tải dữ liệu trận #${matchId}`);
      } else {
        toast.error(res.error || "Không thể tải chi tiết trận đấu.");
      }
    } catch {
      toast.error("Lỗi khi tải chi tiết trận đấu.");
    } finally {
      setLoadingMatchDetails(false);
    }
  };

  // Toggle match in multi-match selection
  const handleToggleMultiMatch = (matchId: string) => {
    if (cancelledMatchIds.includes(matchId)) {
      toast.error("Trận này đang bị đánh dấu HỦY/LỖI. Hãy khôi phục trước khi chọn.");
      return;
    }

    setSelectedMatchIds(prev => {
      const exists = prev.includes(matchId);
      const next = exists ? prev.filter(id => id !== matchId) : [...prev, matchId];
      if (next.length > 0) {
        aggregateMultipleMatches(next);
      } else {
        setAggregatedTeams([]);
      }
      return next;
    });
  };

  // Quick Aggregate Actions (4 matches / 5 matches CPR / All)
  const handleQuickAggregate = (count: number, isCpr: boolean = false) => {
    // Filter out cancelled matches
    const validMatches = matches.filter(m => !cancelledMatchIds.includes(m.id));
    if (validMatches.length === 0) {
      toast.error("Không có trận đấu hợp lệ nào!");
      return;
    }

    const selected = validMatches.slice(0, count).map(m => m.id);
    setSelectedMatchIds(selected);
    setViewMode("multi");
    
    const parsedThreshold = Number(cprThresholdInput) || 80;
    if (isCpr) {
      setCprEnabled(true);
      setCprThreshold(parsedThreshold);
    } else {
      setCprEnabled(false);
    }
    aggregateMultipleMatches(selected, isCpr, parsedThreshold);
  };

  // Change CPR threshold
  const handleCprThresholdChange = (val: string) => {
    setCprThresholdInput(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setCprThreshold(num);
      if (cprEnabled && selectedMatchIds.length > 0) {
        aggregateMultipleMatches(selectedMatchIds, true, num);
      }
    }
  };

  // Aggregate Multiple Matches Algorithm with Smart CPR & Fuzzy Match
  const aggregateMultipleMatches = async (matchIds: string[], useCpr = cprEnabled, threshold = cprThreshold) => {
    if (matchIds.length === 0) return;
    setViewMode("multi");
    setLoadingMultiMatches(true);

    try {
      const detailsList = await Promise.all(
        matchIds.map(id => getGarenaMatchDetails({ matchId: id, cookie: customCookie || undefined }))
      );

      const teamsList: AggregatedTeam[] = [];

      // Pass 1: Build & Merge Teams
      detailsList.forEach((res, matchIdx) => {
        if (!res.success || !res.match?.ranks) return;
        const currentMatchId = matchIds[matchIdx];

        res.match.ranks.slice(0, 12).forEach((r: RankItem) => {
          const currentIds = (r.playerAccountIds || []).filter(Boolean);
          const currentNames = (r.accountNames || []).filter(Boolean);

          let bestMatch: AggregatedTeam | null = null;
          let highestOverlap = 0;

          for (const existing of teamsList) {
            if (existing.matchScores[currentMatchId]) continue;

            const matchingIds = currentIds.filter(id => existing.playerAccountIds.includes(id)).length;
            const matchingNames = currentNames.filter(name => existing.accountNames.includes(name)).length;
            const matchOverlap = Math.max(matchingIds, matchingNames);

            if (matchOverlap >= 2 && matchOverlap > highestOverlap) {
              highestOverlap = matchOverlap;
              bestMatch = existing;
            }
          }

          if (bestMatch) {
            bestMatch.matchScores[currentMatchId] = {
              score: r.score,
              kill: r.kill,
              booyah: r.booyah,
              rank: r.rank,
            };
            bestMatch.totalBooyah += r.booyah || 0;
            bestMatch.totalKill += r.kill || 0;
            bestMatch.totalScore += r.score || 0;

            currentNames.forEach(name => {
              if (!bestMatch!.accountNames.includes(name)) {
                bestMatch!.accountNames.push(name);
              }
            });
            currentIds.forEach(id => {
              if (!bestMatch!.playerAccountIds.includes(id)) {
                bestMatch!.playerAccountIds.push(id);
              }
            });
          } else if (teamsList.length < 12) {
            const newTeam: AggregatedTeam = {
              teamKey: `team_${teamsList.length + 1}`,
              teamName: r.teamName || `Đội Slot #${teamsList.length + 1}`,
              accountNames: [...currentNames],
              playerAccountIds: [...currentIds],
              matchScores: {
                [currentMatchId]: {
                  score: r.score,
                  kill: r.kill,
                  booyah: r.booyah,
                  rank: r.rank,
                },
              },
              totalBooyah: r.booyah || 0,
              totalKill: r.kill || 0,
              totalScore: r.score || 0,
              finalRank: 0,
            };
            teamsList.push(newTeam);
          }
        });
      });

      // Pass 2: Champion Rush (CPR) Evaluation
      if (useCpr && threshold > 0) {
        teamsList.forEach(team => {
          let runningScore = 0;
          let reachedCpr = false;

          matchIds.forEach((mId, idx) => {
            const matchStat = team.matchScores[mId];
            if (!matchStat) return;

            // Nếu đội đã chạm mốc CPR trước trận này VÀ giành Booyah ở trận này -> Vô địch CPR!
            if (reachedCpr && matchStat.booyah > 0 && !team.isCprChampion) {
              team.isCprChampion = true;
              team.cprWinMatchIndex = idx + 1;
            }

            runningScore += matchStat.score || 0;

            // Kiểm tra xem đội đã chạm mốc CPR chưa
            if (!reachedCpr && runningScore >= threshold) {
              reachedCpr = true;
              team.cprReachedAtMatch = idx + 1;
            }
          });
        });
      }

      // Sort: CPR Champion first -> Total Score DESC -> Total Kill DESC -> Total Booyah DESC
      const sortedTeams = teamsList.sort((a, b) => {
        if (useCpr) {
          if (a.isCprChampion && !b.isCprChampion) return -1;
          if (!a.isCprChampion && b.isCprChampion) return 1;
        }
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.totalKill !== a.totalKill) return b.totalKill - a.totalKill;
        return b.totalBooyah - a.totalBooyah;
      });

      // EXACTLY 12 TEAMS MAX
      const final12 = sortedTeams.slice(0, 12);
      final12.forEach((t, i) => {
        t.finalRank = i + 1;
      });

      setAggregatedTeams(final12);
      toast.success(`Đã tổng hợp 12 đội từ ${matchIds.length} trận đấu!`);
    } catch {
      toast.error("Có lỗi xảy ra khi tổng hợp điểm nhiều trận.");
    } finally {
      setLoadingMultiMatches(false);
    }
  };

  // Edit Team Name in Single Match
  const handleSingleTeamNameChange = (index: number, newName: string) => {
    setRanks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], teamName: newName };
      return updated;
    });
  };

  // Edit Team Name in Aggregated Table
  const handleAggregatedTeamNameChange = (index: number, newName: string) => {
    setAggregatedTeams(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], teamName: newName };
      return updated;
    });
  };

  // Universal File Downloader & Mobile Share Handler
  const triggerUniversalDownload = async (canvas: HTMLCanvasElement, filename: string, title: string) => {
    const dataUrl = canvas.toDataURL("image/png");
    setPreviewImageUrl(dataUrl);
    setPreviewImageTitle(title);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], `${filename}.png`, { type: "image/png" });

      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: title,
            text: "Bảng điểm thi đấu Free Fire Esports",
          });
          toast.success("Đã mở lưu ảnh!");
          return;
        } catch {
          // cancelled
        }
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      toast.success("Đã tạo ảnh bang-diem.png siêu nét!");
    }, "image/png");
  };

  // === ULTRA-CRISP 2K CANVAS PNG EXPORTER (SINGLE MATCH) ===
  const downloadSingleMatchPng = async () => {
    const valid12 = ranks.slice(0, 12);
    if (valid12.length === 0) return;
    setExportingPng(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = 2400;
      const height = 1420;
      canvas.width = width;
      canvas.height = height;

      // Deep Cyberpunk Esports Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#080711");
      bgGrad.addColorStop(0.3, "#0e0f1d");
      bgGrad.addColorStop(0.7, "#141529");
      bgGrad.addColorStop(1, "#07060d");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Gold Glow Header
      const glowTop = ctx.createRadialGradient(width / 2, 80, 20, width / 2, 80, 700);
      glowTop.addColorStop(0, "rgba(245, 158, 11, 0.25)");
      glowTop.addColorStop(1, "transparent");
      ctx.fillStyle = glowTop;
      ctx.fillRect(0, 0, width, height);

      // Outer & Inner Borders
      ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
      ctx.lineWidth = 6;
      ctx.strokeRect(45, 45, width - 90, height - 90);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 2;
      ctx.strokeRect(55, 55, width - 110, height - 110);

      // Header Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 48px 'Segoe UI', Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("BẢNG ĐIỂM CHI TIẾT TRẬN ĐẤU", width / 2, 125);

      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 24px monospace";
      ctx.fillText(`MÃ TRẬN: #${selectedSingleMatchId || "GARENA"}   |   FREE FIRE ESPORTS TOURNAMENT`, width / 2, 170);

      // Table Geometry
      const startX = 85;
      const startY = 220;
      const tableWidth = width - 170;
      const rowHeight = 78;

      // Table Header Row
      ctx.fillStyle = "rgba(245, 158, 11, 0.22)";
      ctx.fillRect(startX, startY, tableWidth, 60);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
      ctx.lineWidth = 3;
      ctx.strokeRect(startX, startY, tableWidth, 60);

      ctx.fillStyle = "#fbbf24";
      ctx.font = "900 22px 'Segoe UI', Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("HẠNG", startX + 30, startY + 38);
      ctx.fillText("ĐỘI TUYỂN", startX + 170, startY + 38);
      ctx.fillText("THÀNH VIÊN TRONG PHÒNG", startX + 600, startY + 38);
      
      ctx.textAlign = "center";
      ctx.fillText("BOOYAH!", startX + 1620, startY + 38);
      ctx.fillText("KILLS", startX + 1850, startY + 38);
      ctx.fillText("TỔNG ĐIỂM", startX + 2100, startY + 38);

      // 12 Rows
      valid12.forEach((r, i) => {
        const y = startY + 70 + i * rowHeight;
        const isTop1 = r.rank === 1;
        const isTop2 = r.rank === 2;
        const isTop3 = r.rank === 3;

        if (isTop1) {
          const goldRowGrad = ctx.createLinearGradient(startX, y, startX + tableWidth, y);
          goldRowGrad.addColorStop(0, "rgba(245, 158, 11, 0.28)");
          goldRowGrad.addColorStop(1, "rgba(234, 88, 12, 0.12)");
          ctx.fillStyle = goldRowGrad;
        } else if (isTop2) {
          ctx.fillStyle = "rgba(148, 163, 184, 0.18)";
        } else if (isTop3) {
          ctx.fillStyle = "rgba(180, 83, 9, 0.18)";
        } else {
          ctx.fillStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.35)";
        }
        ctx.fillRect(startX, y, tableWidth, rowHeight - 8);

        ctx.strokeStyle = isTop1 
          ? "rgba(245, 158, 11, 0.8)" 
          : isTop2 
          ? "rgba(203, 213, 225, 0.4)" 
          : isTop3 
          ? "rgba(217, 119, 6, 0.4)" 
          : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = isTop1 ? 2.5 : 1.5;
        ctx.strokeRect(startX, y, tableWidth, rowHeight - 8);

        // Rank Badge
        ctx.textAlign = "center";
        if (isTop1) {
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(startX + 22, y + 12, 60, 46);
          ctx.fillStyle = "#000000";
          ctx.font = "900 26px sans-serif";
          ctx.fillText("#1", startX + 52, y + 45);
        } else if (isTop2) {
          ctx.fillStyle = "#e2e8f0";
          ctx.fillRect(startX + 22, y + 12, 60, 46);
          ctx.fillStyle = "#000000";
          ctx.font = "900 24px sans-serif";
          ctx.fillText("#2", startX + 52, y + 45);
        } else if (isTop3) {
          ctx.fillStyle = "#b45309";
          ctx.fillRect(startX + 22, y + 12, 60, 46);
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 24px sans-serif";
          ctx.fillText("#3", startX + 52, y + 45);
        } else {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "bold 24px sans-serif";
          ctx.fillText(`#${r.rank}`, startX + 52, y + 45);
        }

        // Team Name
        ctx.textAlign = "left";
        ctx.fillStyle = isTop1 ? "#fef08a" : "#ffffff";
        ctx.font = "bold 24px 'Segoe UI', Inter, sans-serif";
        const teamDisplayName = r.teamName || `Đội Slot #${r.rank}`;
        ctx.fillText(teamDisplayName.slice(0, 24), startX + 170, y + 45);

        // Members
        ctx.fillStyle = "#94a3b8";
        ctx.font = "18px 'Segoe UI', Inter, sans-serif";
        const memberText = (showNames ? r.accountNames : r.playerAccountIds).slice(0, 4).join("   •   ");
        ctx.fillText(memberText.slice(0, 80), startX + 600, y + 44);

        // Booyah
        ctx.textAlign = "center";
        if (r.booyah > 0) {
          ctx.fillStyle = "#f59e0b";
          ctx.font = "bold 22px sans-serif";
          ctx.fillText("👑 BOOYAH!", startX + 1620, y + 45);
        } else {
          ctx.fillStyle = "#64748b";
          ctx.font = "22px monospace";
          ctx.fillText("0", startX + 1620, y + 45);
        }

        // Kills
        ctx.fillStyle = "#f87171";
        ctx.font = "bold 28px monospace";
        ctx.fillText(String(r.kill), startX + 1850, y + 46);

        // Total Points
        ctx.fillStyle = isTop1 ? "#fde047" : "#fbbf24";
        ctx.font = "900 32px monospace";
        ctx.fillText(String(r.score), startX + 2100, y + 47);
      });

      // Footer
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("HỆ THỐNG QUẢN LÝ ESPORTS • BẢNG ĐIỂM TỰ ĐỘNG GARENA FREE FIRE", width / 2, height - 55);

      await triggerUniversalDownload(canvas, "bang-diem", `Bảng Điểm Trận #${selectedSingleMatchId || "1"}`);
    } catch {
      toast.error("Không thể tạo ảnh PNG.");
    } finally {
      setExportingPng(false);
    }
  };

  // === ULTRA-CRISP 2K CANVAS PNG EXPORTER (MULTI-MATCH & CPR) ===
  const downloadMultiMatchPng = async () => {
    const valid12 = aggregatedTeams.slice(0, 12);
    if (valid12.length === 0) return;
    setExportingPng(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = 2400;
      const height = 1420;
      canvas.width = width;
      canvas.height = height;

      // Dark Indigo Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#080614");
      bgGrad.addColorStop(0.3, "#0f0c24");
      bgGrad.addColorStop(0.7, "#171238");
      bgGrad.addColorStop(1, "#06040f");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Top Glow
      const glowTop = ctx.createRadialGradient(width / 2, 80, 20, width / 2, 80, 700);
      glowTop.addColorStop(0, cprEnabled ? "rgba(234, 88, 12, 0.35)" : "rgba(168, 85, 247, 0.28)");
      glowTop.addColorStop(1, "transparent");
      ctx.fillStyle = glowTop;
      ctx.fillRect(0, 0, width, height);

      // Borders
      ctx.strokeStyle = cprEnabled ? "rgba(245, 158, 11, 0.7)" : "rgba(168, 85, 247, 0.6)";
      ctx.lineWidth = 6;
      ctx.strokeRect(45, 45, width - 90, height - 90);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 2;
      ctx.strokeRect(55, 55, width - 110, height - 110);

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 48px 'Segoe UI', Inter, sans-serif";
      ctx.textAlign = "center";
      const title = cprEnabled 
        ? `BẢNG TỔNG HỢP ĐIỂM (CHAMPION RUSH - MỐC ${cprThreshold} ĐIỂM)`
        : `BẢNG TỔNG HỢP ĐIỂM TOÀN GIẢI (${selectedMatchIds.length} TRẬN)`;
      ctx.fillText(title, width / 2, 125);

      ctx.fillStyle = cprEnabled ? "#fbbf24" : "#c084fc";
      ctx.font = "bold 24px monospace";
      ctx.fillText(`CỘNG DỒN TỔNG ĐIỂM TỪ ${selectedMatchIds.length} TRẬN ĐẤU  |  FREE FIRE ESPORTS`, width / 2, 170);

      // Table Geometry
      const startX = 85;
      const startY = 220;
      const tableWidth = width - 170;
      const rowHeight = 78;

      // Header Row
      ctx.fillStyle = cprEnabled ? "rgba(245, 158, 11, 0.25)" : "rgba(168, 85, 247, 0.28)";
      ctx.fillRect(startX, startY, tableWidth, 60);
      ctx.strokeStyle = cprEnabled ? "rgba(245, 158, 11, 0.8)" : "rgba(168, 85, 247, 0.8)";
      ctx.lineWidth = 3;
      ctx.strokeRect(startX, startY, tableWidth, 60);

      ctx.fillStyle = cprEnabled ? "#fef08a" : "#e9d5ff";
      ctx.font = "900 22px 'Segoe UI', Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("HẠNG", startX + 30, startY + 38);
      ctx.fillText("ĐỘI TUYỂN", startX + 160, startY + 38);
      ctx.fillText("THÀNH VIÊN", startX + 500, startY + 38);

      // Match Columns
      const matchColStartX = startX + 1300;
      const matchColWidth = 100;
      selectedMatchIds.forEach((_, idx) => {
        ctx.textAlign = "center";
        ctx.fillText(`T #${idx + 1}`, matchColStartX + idx * matchColWidth + matchColWidth / 2, startY + 38);
      });

      const statStartX = matchColStartX + selectedMatchIds.length * matchColWidth + 30;
      ctx.textAlign = "center";
      ctx.fillText("BOOYAH", statStartX + 60, startY + 38);
      ctx.fillText("TỔNG KILL", statStartX + 200, startY + 38);
      
      ctx.fillStyle = "#fde047";
      ctx.fillText("TỔNG ĐIỂM", startX + tableWidth - 100, startY + 38);

      // 12 Rows
      valid12.forEach((team, i) => {
        const y = startY + 70 + i * rowHeight;
        const isTop1 = team.finalRank === 1;
        const isTop2 = team.finalRank === 2;
        const isTop3 = team.finalRank === 3;

        if (team.isCprChampion) {
          const champGrad = ctx.createLinearGradient(startX, y, startX + tableWidth, y);
          champGrad.addColorStop(0, "rgba(234, 88, 12, 0.45)");
          champGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.35)");
          champGrad.addColorStop(1, "rgba(168, 85, 247, 0.3)");
          ctx.fillStyle = champGrad;
        } else if (isTop1) {
          const goldRowGrad = ctx.createLinearGradient(startX, y, startX + tableWidth, y);
          goldRowGrad.addColorStop(0, "rgba(245, 158, 11, 0.28)");
          goldRowGrad.addColorStop(1, "rgba(168, 85, 247, 0.15)");
          ctx.fillStyle = goldRowGrad;
        } else if (isTop2) {
          ctx.fillStyle = "rgba(148, 163, 184, 0.18)";
        } else if (isTop3) {
          ctx.fillStyle = "rgba(180, 83, 9, 0.18)";
        } else {
          ctx.fillStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.35)";
        }
        ctx.fillRect(startX, y, tableWidth, rowHeight - 8);

        ctx.strokeStyle = team.isCprChampion
          ? "rgba(245, 158, 11, 1)"
          : isTop1 
          ? "rgba(245, 158, 11, 0.8)" 
          : isTop2 
          ? "rgba(203, 213, 225, 0.4)" 
          : isTop3 
          ? "rgba(217, 119, 6, 0.4)" 
          : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = team.isCprChampion ? 3.5 : isTop1 ? 2.5 : 1.5;
        ctx.strokeRect(startX, y, tableWidth, rowHeight - 8);

        // Rank Badge
        ctx.textAlign = "center";
        if (team.isCprChampion) {
          ctx.fillStyle = "#ea580c";
          ctx.fillRect(startX + 22, y + 12, 60, 46);
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 24px sans-serif";
          ctx.fillText("👑", startX + 52, y + 45);
        } else if (isTop1) {
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(startX + 22, y + 12, 60, 46);
          ctx.fillStyle = "#000000";
          ctx.font = "900 26px sans-serif";
          ctx.fillText("#1", startX + 52, y + 45);
        } else if (isTop2) {
          ctx.fillStyle = "#e2e8f0";
          ctx.fillRect(startX + 22, y + 12, 60, 46);
          ctx.fillStyle = "#000000";
          ctx.font = "900 24px sans-serif";
          ctx.fillText("#2", startX + 52, y + 45);
        } else if (isTop3) {
          ctx.fillStyle = "#b45309";
          ctx.fillRect(startX + 22, y + 12, 60, 46);
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 24px sans-serif";
          ctx.fillText("#3", startX + 52, y + 45);
        } else {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "bold 24px sans-serif";
          ctx.fillText(`#${team.finalRank}`, startX + 52, y + 45);
        }

        // Team Name & CPR Badge
        ctx.textAlign = "left";
        ctx.fillStyle = isTop1 ? "#fef08a" : "#ffffff";
        ctx.font = "bold 24px 'Segoe UI', Inter, sans-serif";
        const teamDisplayName = team.teamName.slice(0, 18);
        ctx.fillText(teamDisplayName, startX + 160, y + 45);

        if (team.isCprChampion) {
          ctx.fillStyle = "#ea580c";
          ctx.font = "bold 13px sans-serif";
          ctx.fillText(`👑 VÔ ĐỊCH CHAMPION RUSH (T #${team.cprWinMatchIndex})`, startX + 160, y + 63);
        } else if (team.cprReachedAtMatch) {
          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold 13px sans-serif";
          ctx.fillText(`🎯 ĐỦ ĐIỀU KIỆN KÍCH HOẠT CHAMPION RUSH (T #${team.cprReachedAtMatch})`, startX + 160, y + 63);
        }

        // Members
        ctx.fillStyle = "#94a3b8";
        ctx.font = "17px 'Segoe UI', Inter, sans-serif";
        const members = team.accountNames.slice(0, 4).join("  •  ");
        ctx.fillText(members.slice(0, 50), startX + 500, y + 44);

        // Scores per match
        selectedMatchIds.forEach((mId, idx) => {
          const matchStat = team.matchScores[mId];
          ctx.textAlign = "center";
          if (matchStat) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 22px monospace";
            ctx.fillText(`${matchStat.score}`, matchColStartX + idx * matchColWidth + matchColWidth / 2, y + 36);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "14px monospace";
            ctx.fillText(`(${matchStat.kill}k)`, matchColStartX + idx * matchColWidth + matchColWidth / 2, y + 57);
          } else {
            ctx.fillStyle = "#475569";
            ctx.font = "bold 20px monospace";
            ctx.fillText("-", matchColStartX + idx * matchColWidth + matchColWidth / 2, y + 45);
          }
        });

        // Total Booyah
        ctx.textAlign = "center";
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 24px monospace";
        ctx.fillText(String(team.totalBooyah), statStartX + 60, y + 46);

        // Total Kill
        ctx.fillStyle = "#f87171";
        ctx.font = "bold 26px monospace";
        ctx.fillText(String(team.totalKill), statStartX + 200, y + 46);

        // Total Points
        ctx.fillStyle = "#facc15";
        ctx.font = "900 34px monospace";
        ctx.fillText(String(team.totalScore), startX + tableWidth - 100, y + 48);
      });

      // Footer
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("HỆ THỐNG QUẢN LÝ ESPORTS • BẢNG ĐIỂM TỔNG HỢP TỰ ĐỘNG GARENA FREE FIRE", width / 2, height - 55);

      await triggerUniversalDownload(canvas, "bang-diem", `Bảng Tổng Điểm ${selectedMatchIds.length} Trận`);
    } catch {
      toast.error("Không thể tạo ảnh PNG.");
    } finally {
      setExportingPng(false);
    }
  };

  // Vmnghia catalog load
  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    if (tab === "vmnghia" && catalog.length === 0) {
      setLoadingVmnghia(true);
      try {
        const [catRes, keyRes] = await Promise.all([getCatalog(), getKeys()]);
        if (catRes.success && catRes.data?.scoreboards) {
          setCatalog(catRes.data.scoreboards);
          if (catRes.data.scoreboards.length > 0) {
            setVmnghiaForm(prev => ({ ...prev, scoreboardTypeId: catRes.data.scoreboards[0].id.toString() }));
          }
        }
        if (keyRes.success && Array.isArray(keyRes.data)) {
          setKeys(keyRes.data);
          if (keyRes.data.length > 0) {
            setVmnghiaForm(prev => ({ ...prev, keyId: keyRes.data[0].id.toString() }));
          }
        }
      } catch {
        toast.error("Không thể tải dữ liệu Vmnghia.");
      } finally {
        setLoadingVmnghia(false);
      }
    }
  };

  // Vmnghia Submit
  const handleVmnghiaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingVmnghia(true);
    setVmnghiaResultImage(null);

    try {
      const res = await createScoreboard({
        scoreboardTypeId: Number(vmnghiaForm.scoreboardTypeId),
        keyId: vmnghiaForm.keyId ? Number(vmnghiaForm.keyId) : undefined,
        idGame: vmnghiaForm.idGame,
        timeStart: vmnghiaForm.timeStart,
        timeEnd: vmnghiaForm.timeEnd,
        matchRemoval: Number(vmnghiaForm.matchRemoval),
        cpr: Number(vmnghiaForm.cpr),
      });

      if (res.success && res.data) {
        const url = res.data.imageUrl || res.data.downloadUrl || res.data.resultUrl || res.data.base64;
        if (url) {
          setVmnghiaResultImage(url);
          toast.success("Kết xuất thành công!");
        } else {
          toast.error("API không trả về link ảnh.");
        }
      } else {
        toast.error(res.error || "Có lỗi xảy ra khi tạo bảng điểm.");
      }
    } catch {
      toast.error("Có lỗi hệ thống xảy ra.");
    } finally {
      setSubmittingVmnghia(false);
    }
  };

  const formatUnixTime = (timestamp: number) => {
    const d = new Date(timestamp * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())} (${pad(d.getDate())}/${pad(d.getMonth() + 1)})`;
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <Trophy className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white uppercase flex flex-wrap items-center gap-2">
              Hệ Thống Tính Điểm
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold normal-case">
                Trực tiếp Garena (Max 12 Đội)
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">
              Tự động tính điểm 4-5 trận, Champion Rush tùy chỉnh & Xuất ảnh PNG 2K siêu nét
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-2 w-full md:w-[320px] bg-background/80 border border-border/50 h-9">
            <TabsTrigger value="garena" className="gap-1.5 text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold">
              <Flame className="w-3.5 h-3.5" /> Garena (Free)
            </TabsTrigger>
            <TabsTrigger value="vmnghia" className="gap-1.5 text-xs data-[state=active]:bg-primary font-semibold">
              <Zap className="w-3.5 h-3.5" /> Vmnghia API
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab 1: Garena Free */}
      {activeTab === "garena" && (
        <div className="space-y-4 md:space-y-6">
          {/* Search Card */}
          <Card className="border-amber-500/30 bg-gradient-to-b from-card/95 to-card/60 backdrop-blur-md shadow-2xl">
            <CardHeader className="border-b border-border/40 pb-3 p-4 sm:p-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 md:w-5 md:h-5 text-amber-500 shrink-0" />
                  <CardTitle className="text-base sm:text-lg text-white font-bold">Tìm Kiếm Trận Đấu Custom Room</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCookieSetting(!showCookieSetting)}
                  className="text-xs text-muted-foreground hover:text-white gap-1 h-7 px-2"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  {showCookieSetting ? "Ẩn Session" : "Cấu hình Session Cookie"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-4 p-4 sm:p-6 space-y-4">
              {showCookieSetting && (
                <div className="p-3 rounded-lg bg-background/70 border border-amber-500/20 space-y-2 mb-2">
                  <Label htmlFor="cookie" className="text-xs font-semibold text-amber-300">
                    Garena Session Cookie (Đã tự động lưu vào trình duyệt của bạn)
                  </Label>
                  <Input 
                    id="cookie"
                    placeholder="session=...; session.sig=..."
                    value={customCookie}
                    onChange={(e) => handleCookieChange(e.target.value)}
                    className="text-xs font-mono bg-black/40 border-amber-500/20"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Mặc định hệ thống đã có sẵn Session Cookie. Bạn có thể dán cookie mới khi phiên đăng nhập Garena hết hạn.
                  </p>
                </div>
              )}

              <form onSubmit={handleFindMatches} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
                  
                  {/* Account ID */}
                  <div className="sm:col-span-2 md:col-span-3 space-y-1">
                    <Label htmlFor="accountId" className="text-foreground/90 font-medium text-xs flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-400" /> Account ID <span className="text-amber-500">*</span>
                    </Label>
                    <Input 
                      id="accountId" 
                      placeholder="VD: 7476037837" 
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="bg-background/80 border-amber-500/30 font-mono focus-visible:ring-amber-500 text-white font-bold h-10"
                      required
                    />
                  </div>

                  {/* Khung Ngày */}
                  <div className="sm:col-span-2 md:col-span-3 space-y-1">
                    <Label className="text-foreground/90 font-medium text-xs flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> Ngày thi đấu <span className="text-amber-500">*</span>
                    </Label>
                    <Input 
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (!endDate || endDate < e.target.value) {
                          setEndDate(e.target.value);
                        }
                      }}
                      className="bg-background/80 border-amber-500/30 text-white text-xs h-10"
                      required
                    />
                  </div>

                  {/* Khung Giờ Bắt Đầu */}
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-foreground/90 font-medium text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Giờ bắt đầu
                    </Label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-amber-500/30 bg-background/80 px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {TIME_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-neutral-900 text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Khung Giờ Kết Thúc */}
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-foreground/90 font-medium text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Giờ kết thúc
                    </Label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-amber-500/30 bg-background/80 px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {TIME_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-neutral-900 text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nút Tìm Kiếm */}
                  <div className="sm:col-span-2 md:col-span-2">
                    <Button 
                      type="submit" 
                      disabled={searchingMatches} 
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black tracking-wider shadow-lg shadow-amber-500/25 uppercase h-10"
                    >
                      {searchingMatches ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Đang quét...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-1.5" /> Tìm trận
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>

              {/* Quick Time Selection Presets */}
              <div className="pt-3 border-t border-border/30 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Chọn nhanh khoảng thời gian:
                </span>
                
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: "1 Giờ qua", hours: 1 },
                    { label: "3 Giờ qua", hours: 3 },
                    { label: "6 Giờ qua", hours: 6 },
                    { label: "12 Giờ qua", hours: 12 },
                    { label: "24 Giờ qua", hours: 24 },
                    { label: "Hôm nay (Cả ngày)", start: "00:00", end: "23:59", dayOffset: 0 },
                    { label: "Hôm qua (Cả ngày)", start: "00:00", end: "23:59", dayOffset: -1 },
                    { label: "Ca Chiều (13h - 17h)", start: "13:00", end: "17:00", dayOffset: 0 },
                    { label: "Ca Tối 1 (18h - 20h30)", start: "18:00", end: "20:30", dayOffset: 0 },
                    { label: "Ca Tối 2 (20h30 - 23h30)", start: "20:30", end: "23:30", dayOffset: 0 },
                  ].map((p: any) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        const pad = (n: number) => String(n).padStart(2, "0");
                        if (p.hours) {
                          const now = new Date();
                          const past = new Date(now.getTime() - p.hours * 60 * 60 * 1000);
                          setStartDate(`${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}`);
                          setEndDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
                          setStartTime(`${pad(past.getHours())}:${pad(past.getMinutes())}`);
                          setEndTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
                        } else {
                          const target = new Date();
                          target.setDate(target.getDate() + p.dayOffset);
                          const dateStr = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
                          setStartDate(dateStr);
                          setEndDate(dateStr);
                          setStartTime(p.start);
                          setEndTime(p.end);
                        }
                        toast.info(`Đã đặt: ${p.label}`);
                      }}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-secondary/60 hover:bg-amber-500 hover:text-black border border-border/40 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Buttons, Removal Tools & Multi-Match Toolbar */}
              {matches.length > 0 && (
                <div className="pt-3 border-t border-border/40 space-y-3">
                  
                  {/* CPR Threshold & Removal Controls */}
                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    {/* CPR Threshold Input */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" /> Mốc Điểm CPR:
                      </span>
                      <Input 
                        type="number"
                        min="0"
                        max="200"
                        placeholder="80"
                        value={cprThresholdInput}
                        onChange={(e) => handleCprThresholdChange(e.target.value)}
                        className="w-20 h-8 text-xs font-mono font-bold text-center bg-black/60 border-purple-500/40 focus-visible:ring-purple-500"
                      />
                      <div className="flex items-center gap-1">
                        {[80, 70, 60, 50].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleCprThresholdChange(String(num))}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              cprThresholdInput === String(num)
                                ? "bg-amber-500 text-black border-amber-400"
                                : "bg-black/40 text-muted-foreground border-border/40 hover:text-white"
                            }`}
                          >
                            {num}đ
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Remove/Remake Match Input */}
                    <div className="flex items-center gap-1.5 w-full md:w-auto">
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1 shrink-0">
                        <Ban className="w-3.5 h-3.5" /> Bỏ trận lỗi:
                      </span>
                      <Input 
                        placeholder="Số trận (VD: 3)"
                        value={removeMatchInput}
                        onChange={(e) => setRemoveMatchInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyRemoveMatch()}
                        className="w-28 h-8 text-xs font-mono bg-black/60 border-red-500/30 text-center"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleApplyRemoveMatch}
                        className="h-8 text-xs border-red-500/40 text-red-300 hover:bg-red-500/20 px-2.5 font-bold"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Danh sách {matches.length} trận đấu:
                    </Label>

                    <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAggregate(4, false)}
                        className="text-xs h-7 gap-1 border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black font-bold flex-1 sm:flex-none"
                      >
                        <Layers className="w-3.5 h-3.5" /> Tổng Hợp 4 Trận
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAggregate(5, true)}
                        className="text-xs h-7 gap-1 border-purple-500/40 text-purple-300 bg-purple-500/10 hover:bg-purple-500 hover:text-white font-bold flex-1 sm:flex-none"
                      >
                        <Crown className="w-3.5 h-3.5" /> 5 Trận (CPR {cprThresholdInput}đ)
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleQuickAggregate(matches.length, false)}
                        className="text-xs h-7 text-muted-foreground hover:text-white"
                      >
                        Tất cả ({matches.length - cancelledMatchIds.length})
                      </Button>
                    </div>
                  </div>

                  {/* Match Badges List */}
                  <div className="flex flex-wrap gap-1.5">
                    {matches.map((m, idx) => {
                      const isCancelled = cancelledMatchIds.includes(m.id);
                      const isSingleSelected = viewMode === "single" && selectedSingleMatchId === m.id;
                      const isMultiSelected = viewMode === "multi" && selectedMatchIds.includes(m.id);

                      return (
                        <div
                          key={m.id}
                          className={`rounded-lg transition-all duration-200 flex items-center border overflow-hidden ${
                            isCancelled
                              ? "bg-red-950/30 text-red-400 border-red-500/40 opacity-60 line-through"
                              : isSingleSelected
                              ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30 scale-105"
                              : isMultiSelected
                              ? "bg-purple-600/30 text-purple-200 border-purple-500 shadow-md"
                              : "bg-background/80 text-foreground border-border/60 hover:border-amber-500/60"
                          }`}
                        >
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleToggleMultiMatch(m.id)}
                              className="px-2 py-2 hover:bg-white/10 text-muted-foreground transition-colors"
                              title="Chọn vào danh sách tính tổng điểm"
                            >
                              {selectedMatchIds.includes(m.id) ? (
                                <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                              ) : (
                                <Square className="w-3.5 h-3.5 opacity-50" />
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleSelectSingleMatch(m.id)}
                            className="px-2.5 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5"
                          >
                            <span>Trận #{idx + 1}</span>
                            <span className="opacity-75 font-sans font-normal text-[10px]">({formatUnixTime(m.startTime)})</span>
                            {isCancelled && <span className="text-[10px] text-red-400 normal-case no-underline font-bold">[HỦY]</span>}
                          </button>

                          {/* Toggle Cancel Match Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleCancelMatch(m.id)}
                            className="px-1.5 py-2 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors border-l border-border/20"
                            title={isCancelled ? "Khôi phục lại trận đấu" : "Đánh dấu hủy/lỗi trận này"}
                          >
                            {isCancelled ? (
                              <RotateCcw className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Ban className="w-3 h-3 opacity-60 hover:opacity-100" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* VIEW MODE 1: SINGLE MATCH SCOREBOARD (MAX 12 TEAMS) */}
          {viewMode === "single" && (
            loadingMatchDetails ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-card/20 rounded-2xl border border-border/30">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-xs sm:text-sm font-medium text-muted-foreground animate-pulse">
                  Đang trích xuất điểm số trận đấu từ Garena...
                </p>
              </div>
            ) : ranks.length > 0 ? (
              <Card className="border-amber-500/30 bg-gradient-to-b from-card/95 to-card/70 backdrop-blur-md shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-border/40 pb-3 p-4 sm:p-6 bg-black/40">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Medal className="w-5 h-5 text-amber-400 shrink-0" />
                        <CardTitle className="text-base sm:text-xl font-black uppercase text-white tracking-wide">
                          Bảng Điểm Trận Đấu (Top 1 - 12)
                        </CardTitle>
                      </div>
                      <CardDescription className="font-mono text-xs mt-0.5">
                        Mã trận: <span className="text-amber-400 font-bold">#{selectedSingleMatchId}</span>
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowNames(!showNames)}
                        className="text-xs h-8 border-amber-500/30 text-amber-300 hover:bg-amber-500/10 flex-1 md:flex-none"
                      >
                        {showNames ? "Hiện ID" : "Hiện Tên"}
                      </Button>
                      
                      <Button 
                        size="sm" 
                        disabled={exportingPng}
                        onClick={downloadSingleMatchPng}
                        className="text-xs h-8 gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase shadow-lg shadow-amber-500/25 flex-1 md:flex-none"
                      >
                        {exportingPng ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                        Tải Ảnh PNG (2K Siêu Nét)
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-neutral-950/80 border-b border-border/50 text-[11px] uppercase tracking-wider text-muted-foreground font-black">
                        <th className="py-3.5 px-4 text-center w-16">Hạng</th>
                        <th className="py-3.5 px-4 w-48">Đội Tuyển</th>
                        <th className="py-3.5 px-4">Thành Viên</th>
                        <th className="py-3.5 px-3 text-center w-28">Booyah!</th>
                        <th className="py-3.5 px-3 text-center w-20">Số Kill</th>
                        <th className="py-3.5 px-4 text-center w-28">Tổng Điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 text-xs sm:text-sm">
                      {ranks.slice(0, 12).map((r, index) => {
                        const isTop1 = r.rank === 1;
                        const isTop2 = r.rank === 2;
                        const isTop3 = r.rank === 3;

                        return (
                          <tr 
                            key={r.rank}
                            className={`transition-colors hover:bg-white/[0.04] ${
                              isTop1 
                                ? "bg-amber-500/[0.12] border-l-4 border-l-amber-500" 
                                : isTop2 
                                ? "bg-slate-400/[0.08] border-l-4 border-l-slate-400" 
                                : isTop3 
                                ? "bg-amber-700/[0.08] border-l-4 border-l-amber-700" 
                                : ""
                            }`}
                          >
                            <td className="py-3.5 px-4 text-center font-black">
                              <span 
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${
                                  isTop1 
                                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/50" 
                                    : isTop2 
                                    ? "bg-slate-300 text-black" 
                                    : isTop3 
                                    ? "bg-amber-700 text-white" 
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                #{r.rank}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <Input 
                                placeholder={`Đội slot #${r.rank}`}
                                value={r.teamName || ""}
                                onChange={(e) => handleSingleTeamNameChange(index, e.target.value)}
                                className="h-8 text-xs font-bold bg-background/60 border-border/50 focus-visible:ring-amber-500 text-white"
                              />
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1.5">
                                {showNames ? (
                                  r.accountNames.map((name, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-black/50 border border-border/40 text-[11px] font-medium text-foreground">
                                      {name}
                                    </span>
                                  ))
                                ) : (
                                  r.playerAccountIds.map((id, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-black/50 border border-border/40 text-[11px] font-mono text-muted-foreground">
                                      {id}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              {r.booyah > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                  <Sparkles className="w-3.5 h-3.5" /> Booyah!
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs font-mono">0</span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-sm text-red-400">
                                <Crosshair className="w-3.5 h-3.5" />
                                {r.kill}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-block px-3 py-1 rounded-md bg-white/10 font-mono font-black text-base text-amber-300 border border-amber-500/30">
                                {r.score}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ) : null
          )}

          {/* VIEW MODE 2: MULTI-MATCH AGGREGATED SCOREBOARD (EXACT 12 TEAMS & CPR) */}
          {viewMode === "multi" && (
            loadingMultiMatches ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-card/20 rounded-2xl border border-border/30">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <p className="text-xs sm:text-sm font-medium text-muted-foreground animate-pulse">
                  Đang tính toán và tổng hợp 12 đội từ {selectedMatchIds.length} trận đấu...
                </p>
              </div>
            ) : aggregatedTeams.length > 0 ? (
              <Card className="border-purple-500/40 bg-gradient-to-b from-card/95 to-card/70 backdrop-blur-md shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-border/40 pb-3 p-4 sm:p-6 bg-purple-950/20">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-yellow-400 shrink-0" />
                        <CardTitle className="text-base sm:text-xl font-black uppercase text-white tracking-wide">
                          Bảng Tổng Hợp 12 Đội ({selectedMatchIds.length} Trận)
                        </CardTitle>
                        {cprEnabled && (
                          <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-yellow-300 border border-amber-500/50 font-black flex items-center gap-1">
                            <Target className="w-3 h-3 text-amber-400" /> CPR {cprThreshold}đ
                          </span>
                        )}
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        Cộng dồn điểm & kill qua {selectedMatchIds.length} trận đấu (Chuẩn 12 Đội)
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                      <Button 
                        size="sm" 
                        disabled={exportingPng}
                        onClick={downloadMultiMatchPng}
                        className="text-xs h-8 gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black uppercase shadow-lg shadow-purple-500/30 flex-1 md:flex-none"
                      >
                        {exportingPng ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                        Tải Ảnh Bảng Tổng (2K Siêu Nét)
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[720px]">
                    <thead>
                      <tr className="bg-neutral-950/80 border-b border-border/50 text-[11px] uppercase tracking-wider text-muted-foreground font-black">
                        <th className="py-3.5 px-3 text-center w-14">Hạng</th>
                        <th className="py-3.5 px-4 w-44">Đội Tuyển</th>
                        <th className="py-3.5 px-4">Thành Viên</th>
                        {selectedMatchIds.map((mId, i) => (
                          <th key={mId} className="py-3.5 px-2.5 text-center text-[10px] w-20">
                            Trận #{i + 1}
                          </th>
                        ))}
                        <th className="py-3.5 px-2.5 text-center w-16">Booyah</th>
                        <th className="py-3.5 px-2.5 text-center w-20">Tổng Kill</th>
                        <th className="py-3.5 px-4 text-center w-28 bg-purple-500/10 text-purple-300">Tổng Điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 text-xs sm:text-sm">
                      {aggregatedTeams.slice(0, 12).map((team, index) => {
                        const isTop1 = team.finalRank === 1;
                        const isTop2 = team.finalRank === 2;
                        const isTop3 = team.finalRank === 3;

                        return (
                          <tr 
                            key={team.teamKey}
                            className={`transition-colors hover:bg-white/[0.04] ${
                              team.isCprChampion
                                ? "bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-purple-500/20 border-l-4 border-l-orange-500"
                                : isTop1 
                                ? "bg-amber-500/[0.12] border-l-4 border-l-amber-500" 
                                : isTop2 
                                ? "bg-slate-400/[0.08] border-l-4 border-l-slate-400" 
                                : isTop3 
                                ? "bg-amber-700/[0.08] border-l-4 border-l-amber-700" 
                                : ""
                            }`}
                          >
                            <td className="py-3.5 px-3 text-center font-black">
                              <span 
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${
                                  team.isCprChampion
                                    ? "bg-gradient-to-br from-amber-400 to-orange-600 text-black shadow-lg shadow-orange-500/50"
                                    : isTop1 
                                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/50" 
                                    : isTop2 
                                    ? "bg-slate-300 text-black" 
                                    : isTop3 
                                    ? "bg-amber-700 text-white" 
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {team.isCprChampion ? "👑" : `#${team.finalRank}`}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <Input 
                                  placeholder={`Đội slot #${team.finalRank}`}
                                  value={team.teamName || ""}
                                  onChange={(e) => handleAggregatedTeamNameChange(index, e.target.value)}
                                  className="h-7 text-xs font-bold bg-background/60 border-border/50 focus-visible:ring-purple-500 text-white"
                                />
                                {team.isCprChampion ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-[10px] font-black text-orange-400">
                                    👑 Vô Địch Champion Rush (Trận #{team.cprWinMatchIndex})
                                  </span>
                                ) : team.cprReachedAtMatch ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                                    🎯 Đủ điều kiện kích hoạt Champion Rush (Trận #{team.cprReachedAtMatch})
                                  </span>
                                ) : null}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1">
                                {team.accountNames.map((name, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded bg-black/50 border border-border/30 text-[11px] font-medium">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {selectedMatchIds.map((mId) => {
                              const matchStat = team.matchScores[mId];
                              return (
                                <td key={mId} className="py-3.5 px-2.5 text-center font-mono text-xs">
                                  {matchStat ? (
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-foreground">{matchStat.score}đ</span>
                                      <div className="text-[10px] text-muted-foreground">({matchStat.kill}k)</div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground opacity-40">-</span>
                                  )}
                                </td>
                              );
                            })}

                            <td className="py-3.5 px-2.5 text-center">
                              <span className="font-mono font-bold text-amber-400">{team.totalBooyah}</span>
                            </td>

                            <td className="py-3.5 px-2.5 text-center">
                              <span className="font-mono font-bold text-red-400">{team.totalKill}</span>
                            </td>

                            <td className="py-3.5 px-4 text-center bg-purple-500/10">
                              <span className="inline-block px-3 py-1 rounded-md bg-purple-500/30 font-mono font-black text-base text-yellow-300 border border-purple-500/40">
                                {team.totalScore}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ) : null
          )}

          {matches.length === 0 && !searchingMatches && (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-card/20 rounded-2xl border border-dashed border-border/40 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground text-sm sm:text-base">Chưa có dữ liệu trận đấu</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Hãy chọn ngày, khung giờ và bấm "Tìm trận" để xem chi tiết từng trận hoặc tính tổng điểm 4 trận, 5 trận CPR.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Vmnghia API */}
      {activeTab === "vmnghia" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-5 space-y-4">
            <Card className="border-primary/20 bg-card/40 backdrop-blur-sm shadow-xl">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Kết Xuất Qua Vmnghia (Có Phí)
                </CardTitle>
                <CardDescription>Yêu cầu tài khoản Vmnghia còn số dư</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleVmnghiaSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="scoreboardTypeId" className="text-xs">Mẫu Bảng Điểm</Label>
                    <select
                      id="scoreboardTypeId"
                      value={vmnghiaForm.scoreboardTypeId}
                      onChange={(e) => setVmnghiaForm(prev => ({ ...prev, scoreboardTypeId: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                    >
                      {catalog.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name || item.code || `Mẫu #${item.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="keyId" className="text-xs">Key Dữ Liệu</Label>
                    <select
                      id="keyId"
                      value={vmnghiaForm.keyId}
                      onChange={(e) => setVmnghiaForm(prev => ({ ...prev, keyId: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                    >
                      <option value="">-- Không chọn --</option>
                      {keys.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.custom || item.keyValue}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="idGame" className="text-xs">ID Game (ID Phòng)</Label>
                    <Input 
                      id="idGame" 
                      placeholder="VD: 7476037837"
                      value={vmnghiaForm.idGame}
                      onChange={(e) => setVmnghiaForm(prev => ({ ...prev, idGame: e.target.value }))}
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="timeStart" className="text-xs">Bắt đầu</Label>
                      <Input 
                        id="timeStart" 
                        placeholder="YYYY/MM/DD HH:mm:ss"
                        value={vmnghiaForm.timeStart}
                        onChange={(e) => setVmnghiaForm(prev => ({ ...prev, timeStart: e.target.value }))}
                        className="h-9 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="timeEnd" className="text-xs">Kết thúc</Label>
                      <Input 
                        id="timeEnd" 
                        placeholder="YYYY/MM/DD HH:mm:ss"
                        value={vmnghiaForm.timeEnd}
                        onChange={(e) => setVmnghiaForm(prev => ({ ...prev, timeEnd: e.target.value }))}
                        className="h-9 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={submittingVmnghia} className="w-full mt-2 font-bold h-9 text-xs">
                    {submittingVmnghia ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
                    Kết xuất ảnh
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-7">
            <Card className="border-primary/20 bg-card/40 backdrop-blur-sm shadow-xl min-h-[300px] flex flex-col justify-center items-center p-4">
              {vmnghiaResultImage ? (
                <img src={vmnghiaResultImage} alt="Kết quả" className="w-full h-auto rounded-lg" />
              ) : (
                <div className="text-center text-muted-foreground text-xs">
                  <p>Chưa có ảnh kết xuất</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* MOBILE & DESKTOP IMAGE PREVIEW MODAL */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-neutral-950 border border-amber-500/50 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-3 sm:p-4 border-b border-border/40 flex items-center justify-between bg-black/60">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">{previewImageTitle}</h3>
              </div>
              <button 
                onClick={() => setPreviewImageUrl(null)}
                className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 overflow-y-auto flex-1 flex flex-col items-center bg-black/40">
              <img 
                src={previewImageUrl} 
                alt="Bảng điểm PNG" 
                className="w-full h-auto max-h-[62vh] object-contain rounded-lg border border-border/40 shadow-2xl select-all"
              />
              <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 text-left">
                <Smartphone className="w-4 h-4 shrink-0 text-amber-400" />
                <span><strong>Mẹo trên điện thoại:</strong> Bạn có thể <strong>nhấn giữ vào ảnh 1 giây</strong> để chọn "Lưu hình ảnh / Tải ảnh về" vào Bộ sưu tập ảnh.</span>
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-border/40 bg-black/60 flex items-center justify-end gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setPreviewImageUrl(null)}
                className="text-xs h-8"
              >
                Đóng
              </Button>
              <a 
                href={previewImageUrl} 
                download="bang-diem.png"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase shadow-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Tải về bang-diem.png
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
