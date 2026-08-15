"use client";

import { useEffect, useState } from "react";
import { findGarenaMatches, getGarenaMatchDetails } from "@/actions/garena";
import { getCatalog, getKeys, createScoreboard } from "@/actions/vmnghia";
import { 
  Trophy, 
  Clock, 
  Search, 
  Loader2, 
  Download, 
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
  ImageIcon
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

  // Mode: Single Match vs Multi Match (4 matches / 5 matches CPR)
  const [viewMode, setViewMode] = useState<"single" | "multi">("single");
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [selectedSingleMatchId, setSelectedSingleMatchId] = useState<string | null>(null);
  
  // Single match state
  const [loadingMatchDetails, setLoadingMatchDetails] = useState(false);
  const [ranks, setRanks] = useState<RankItem[]>([]);
  const [showNames, setShowNames] = useState(true);

  // Multi-match aggregated state
  const [loadingMultiMatches, setLoadingMultiMatches] = useState(false);
  const [aggregatedTeams, setAggregatedTeams] = useState<AggregatedTeam[]>([]);
  const [cprThreshold, setCprThreshold] = useState<number>(0);
  const [exportingPng, setExportingPng] = useState(false);

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
    setStartDate(todayStr);
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

  // Select Single Match
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
        setRanks(res.match.ranks);
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
    if (matches.length === 0) return;
    const selected = matches.slice(0, count).map(m => m.id);
    setSelectedMatchIds(selected);
    setViewMode("multi");
    if (isCpr) {
      setCprThreshold(80);
    } else {
      setCprThreshold(0);
    }
    aggregateMultipleMatches(selected);
  };

  // Aggregate Multiple Matches Algorithm
  const aggregateMultipleMatches = async (matchIds: string[]) => {
    if (matchIds.length === 0) return;
    setViewMode("multi");
    setLoadingMultiMatches(true);

    try {
      const detailsList = await Promise.all(
        matchIds.map(id => getGarenaMatchDetails({ matchId: id, cookie: customCookie || undefined }))
      );

      const teamsList: AggregatedTeam[] = [];

      detailsList.forEach((res, matchIdx) => {
        if (!res.success || !res.match?.ranks) return;
        const currentMatchId = matchIds[matchIdx];

        res.match.ranks.forEach((r: RankItem, rankIndex: number) => {
          const currentIds = (r.playerAccountIds || []).filter(Boolean);
          const currentNames = (r.accountNames || []).filter(Boolean);

          // Tìm xem đội này đã xuất hiện trong danh sách chưa (ghép đội thông minh qua tên/ID tuyển thủ)
          let bestMatch: AggregatedTeam | null = null;
          let highestOverlap = 0;

          for (const existing of teamsList) {
            // Đội này chưa có điểm ở trận hiện tại
            if (existing.matchScores[currentMatchId]) continue;

            // Đếm số ID trùng
            const matchingIds = currentIds.filter(id => existing.playerAccountIds.includes(id)).length;
            // Đếm số Tên tuyển thủ trùng
            const matchingNames = currentNames.filter(name => existing.accountNames.includes(name)).length;

            const matchOverlap = Math.max(matchingIds, matchingNames);

            // Nếu trùng từ 2 tuyển thủ trở lên (hoặc >= 1 nếu phòng ít người), ghép vào đúng đội đó
            if (matchOverlap >= 2 && matchOverlap > highestOverlap) {
              highestOverlap = matchOverlap;
              bestMatch = existing;
            }
          }

          if (bestMatch) {
            // Ghép điểm trận này vào đội cũ
            bestMatch.matchScores[currentMatchId] = {
              score: r.score,
              kill: r.kill,
              booyah: r.booyah,
              rank: r.rank,
            };
            bestMatch.totalBooyah += r.booyah || 0;
            bestMatch.totalKill += r.kill || 0;
            bestMatch.totalScore += r.score || 0;

            // Bổ sung thành viên mới (nếu có tuyển thủ dự bị)
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
          } else {
            // Tạo đội mới
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

      // Sắp xếp thứ hạng tổng: Tổng điểm DESC -> Tổng Kill DESC -> Tổng Booyah DESC
      const sortedTeams = teamsList.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.totalKill !== a.totalKill) return b.totalKill - a.totalKill;
        return b.totalBooyah - a.totalBooyah;
      });

      sortedTeams.forEach((t, i) => {
        t.finalRank = i + 1;
      });

      setAggregatedTeams(sortedTeams);
      toast.success(`Đã tổng hợp điểm thành công từ ${matchIds.length} trận đấu!`);
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

  // === CANVAS HIGH RESOLUTION PNG EXPORTER ===
  const downloadSingleMatchPng = () => {
    if (ranks.length === 0) return;
    setExportingPng(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = 1920;
      const height = 1120;
      canvas.width = width;
      canvas.height = height;

      // Background Gradient (Dark Esports Theme)
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#0a0a0f");
      bgGrad.addColorStop(0.5, "#12131c");
      bgGrad.addColorStop(1, "#07070a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Neon Glow Accents
      const glow1 = ctx.createRadialGradient(200, 100, 10, 200, 100, 500);
      glow1.addColorStop(0, "rgba(245, 158, 11, 0.15)");
      glow1.addColorStop(1, "transparent");
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      const glow2 = ctx.createRadialGradient(width - 200, height - 100, 10, width - 200, height - 100, 600);
      glow2.addColorStop(0, "rgba(234, 88, 12, 0.12)");
      glow2.addColorStop(1, "transparent");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);

      // Outer Border
      ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      // Header Banner
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 38px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("BẢNG ĐIỂM CHI TIẾT TRẬN ĐẤU - FREE FIRE ESPORTS", width / 2, 105);

      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 20px monospace";
      ctx.fillText(`MÃ TRẬN ĐẤU: #${selectedSingleMatchId || "GARENA"}  |  NGÀY: ${startDate || "HÔM NAY"}`, width / 2, 140);

      // Table Geometry
      const startX = 80;
      const startY = 180;
      const tableWidth = width - 160;
      const rowHeight = 65;

      // Table Header Row
      ctx.fillStyle = "rgba(245, 158, 11, 0.2)";
      ctx.fillRect(startX, startY, tableWidth, 50);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, tableWidth, 50);

      ctx.fillStyle = "#fbbf24";
      ctx.font = "900 18px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("HẠNG", startX + 25, startY + 32);
      ctx.fillText("ĐỘI TUYỂN", startX + 130, startY + 32);
      ctx.fillText("THÀNH VIÊN", startX + 450, startY + 32);
      
      ctx.textAlign = "center";
      ctx.fillText("BOOYAH!", startX + 1240, startY + 32);
      ctx.fillText("KILLS", startX + 1430, startY + 32);
      ctx.fillText("TỔNG ĐIỂM", startX + 1640, startY + 32);

      // Table Data Rows
      ranks.forEach((r, i) => {
        const y = startY + 60 + i * rowHeight;
        const isTop1 = r.rank === 1;
        const isTop2 = r.rank === 2;
        const isTop3 = r.rank === 3;

        // Row background
        if (isTop1) {
          ctx.fillStyle = "rgba(245, 158, 11, 0.18)";
        } else if (isTop2) {
          ctx.fillStyle = "rgba(148, 163, 184, 0.12)";
        } else if (isTop3) {
          ctx.fillStyle = "rgba(180, 83, 9, 0.12)";
        } else {
          ctx.fillStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.25)";
        }
        ctx.fillRect(startX, y, tableWidth, rowHeight - 6);

        // Row border
        ctx.strokeStyle = isTop1 ? "rgba(245, 158, 11, 0.6)" : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, y, tableWidth, rowHeight - 6);

        // Rank Badge
        ctx.textAlign = "center";
        if (isTop1) {
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(startX + 18, y + 10, 48, 38);
          ctx.fillStyle = "#000000";
          ctx.font = "900 22px sans-serif";
          ctx.fillText("#1", startX + 42, y + 37);
        } else if (isTop2) {
          ctx.fillStyle = "#cbd5e1";
          ctx.fillRect(startX + 18, y + 10, 48, 38);
          ctx.fillStyle = "#000000";
          ctx.font = "900 20px sans-serif";
          ctx.fillText("#2", startX + 42, y + 37);
        } else if (isTop3) {
          ctx.fillStyle = "#b45309";
          ctx.fillRect(startX + 18, y + 10, 48, 38);
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 20px sans-serif";
          ctx.fillText("#3", startX + 42, y + 37);
        } else {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "bold 20px sans-serif";
          ctx.fillText(`#${r.rank}`, startX + 42, y + 37);
        }

        // Team Name
        ctx.textAlign = "left";
        ctx.fillStyle = isTop1 ? "#fef08a" : "#ffffff";
        ctx.font = "bold 20px sans-serif";
        const teamDisplayName = r.teamName || `Đội Slot #${r.rank}`;
        ctx.fillText(teamDisplayName.slice(0, 24), startX + 130, y + 37);

        // Member names
        ctx.fillStyle = "#94a3b8";
        ctx.font = "15px sans-serif";
        const memberText = (showNames ? r.accountNames : r.playerAccountIds).slice(0, 4).join(" • ");
        ctx.fillText(memberText.slice(0, 70), startX + 450, y + 36);

        // Booyah
        ctx.textAlign = "center";
        if (r.booyah > 0) {
          ctx.fillStyle = "#f59e0b";
          ctx.font = "bold 18px sans-serif";
          ctx.fillText("⭐ 1", startX + 1240, y + 37);
        } else {
          ctx.fillStyle = "#64748b";
          ctx.font = "18px monospace";
          ctx.fillText("0", startX + 1240, y + 37);
        }

        // Kills
        ctx.fillStyle = "#f87171";
        ctx.font = "bold 22px monospace";
        ctx.fillText(String(r.kill), startX + 1430, y + 38);

        // Total Score
        ctx.fillStyle = isTop1 ? "#fde047" : "#fbbf24";
        ctx.font = "900 24px monospace";
        ctx.fillText(String(r.score), startX + 1640, y + 39);
      });

      // Watermark Footer
      ctx.fillStyle = "#64748b";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("HỆ THỐNG QUẢN LÝ ESPORTS • BẢNG ĐIỂM TỰ ĐỘNG GARENA FREE FIRE", width / 2, height - 55);

      // Download
      const link = document.createElement("a");
      link.download = `bang-diem-tran-${selectedSingleMatchId || "ff"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Đã tải ảnh bảng điểm PNG thành công!");
    } catch {
      toast.error("Không thể tạo ảnh PNG.");
    } finally {
      setExportingPng(false);
    }
  };

  // Multi-Match PNG Exporter
  const downloadMultiMatchPng = () => {
    if (aggregatedTeams.length === 0) return;
    setExportingPng(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = 1920;
      const height = 1150;
      canvas.width = width;
      canvas.height = height;

      // Dark Purple Esports Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#080612");
      bgGrad.addColorStop(0.5, "#110e24");
      bgGrad.addColorStop(1, "#05040a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Neon Accents
      const glow1 = ctx.createRadialGradient(300, 100, 10, 300, 100, 600);
      glow1.addColorStop(0, "rgba(168, 85, 247, 0.2)");
      glow1.addColorStop(1, "transparent");
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      // Outer Border
      ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 38px sans-serif";
      ctx.textAlign = "center";
      const title = cprThreshold > 0 
        ? `BẢNG TỔNG HỢP ĐIỂM (CHAMPION RUSH - ${selectedMatchIds.length} TRẬN)`
        : `BẢNG TỔNG HỢP ĐIỂM TOÀN GIẢI (${selectedMatchIds.length} TRẬN)`;
      ctx.fillText(title, width / 2, 105);

      ctx.fillStyle = "#c084fc";
      ctx.font = "bold 20px monospace";
      ctx.fillText(`CỘNG DỒN TỪ ${selectedMatchIds.length} TRẬN ĐẤU  |  FREE FIRE ESPORTS`, width / 2, 140);

      // Table Geometry
      const startX = 80;
      const startY = 180;
      const tableWidth = width - 160;
      const rowHeight = 65;

      // Header Row
      ctx.fillStyle = "rgba(168, 85, 247, 0.25)";
      ctx.fillRect(startX, startY, tableWidth, 50);
      ctx.strokeStyle = "rgba(168, 85, 247, 0.7)";
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, tableWidth, 50);

      ctx.fillStyle = "#e9d5ff";
      ctx.font = "900 17px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("HẠNG", startX + 25, startY + 32);
      ctx.fillText("ĐỘI TUYỂN", startX + 120, startY + 32);
      ctx.fillText("THÀNH VIÊN", startX + 380, startY + 32);

      // Match columns
      const matchColStartX = startX + 980;
      const matchColWidth = 75;
      selectedMatchIds.forEach((_, idx) => {
        ctx.textAlign = "center";
        ctx.fillText(`T #${idx + 1}`, matchColStartX + idx * matchColWidth + matchColWidth / 2, startY + 32);
      });

      const statStartX = matchColStartX + selectedMatchIds.length * matchColWidth + 20;
      ctx.textAlign = "center";
      ctx.fillText("BOOYAH", statStartX + 45, startY + 32);
      ctx.fillText("TỔNG KILL", statStartX + 155, startY + 32);
      
      ctx.fillStyle = "#fde047";
      ctx.fillText("TỔNG ĐIỂM", startX + tableWidth - 75, startY + 32);

      // Data Rows
      aggregatedTeams.forEach((team, i) => {
        const y = startY + 60 + i * rowHeight;
        const isTop1 = team.finalRank === 1;
        const isTop2 = team.finalRank === 2;
        const isTop3 = team.finalRank === 3;

        if (isTop1) {
          ctx.fillStyle = "rgba(245, 158, 11, 0.18)";
        } else if (isTop2) {
          ctx.fillStyle = "rgba(148, 163, 184, 0.12)";
        } else if (isTop3) {
          ctx.fillStyle = "rgba(180, 83, 9, 0.12)";
        } else {
          ctx.fillStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.25)";
        }
        ctx.fillRect(startX, y, tableWidth, rowHeight - 6);

        ctx.strokeStyle = isTop1 ? "rgba(245, 158, 11, 0.6)" : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, y, tableWidth, rowHeight - 6);

        // Rank Badge
        ctx.textAlign = "center";
        if (isTop1) {
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(startX + 18, y + 10, 48, 38);
          ctx.fillStyle = "#000000";
          ctx.font = "900 22px sans-serif";
          ctx.fillText("#1", startX + 42, y + 37);
        } else if (isTop2) {
          ctx.fillStyle = "#cbd5e1";
          ctx.fillRect(startX + 18, y + 10, 48, 38);
          ctx.fillStyle = "#000000";
          ctx.font = "900 20px sans-serif";
          ctx.fillText("#2", startX + 42, y + 37);
        } else if (isTop3) {
          ctx.fillStyle = "#b45309";
          ctx.fillRect(startX + 18, y + 10, 48, 38);
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 20px sans-serif";
          ctx.fillText("#3", startX + 42, y + 37);
        } else {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "bold 20px sans-serif";
          ctx.fillText(`#${team.finalRank}`, startX + 42, y + 37);
        }

        // Team Name
        ctx.textAlign = "left";
        ctx.fillStyle = isTop1 ? "#fef08a" : "#ffffff";
        ctx.font = "bold 19px sans-serif";
        ctx.fillText(team.teamName.slice(0, 20), startX + 120, y + 37);

        // Members
        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px sans-serif";
        const members = team.accountNames.slice(0, 4).join(" • ");
        ctx.fillText(members.slice(0, 45), startX + 380, y + 36);

        // Scores per match
        selectedMatchIds.forEach((mId, idx) => {
          const matchStat = team.matchScores[mId];
          ctx.textAlign = "center";
          if (matchStat) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 17px monospace";
            ctx.fillText(`${matchStat.score}`, matchColStartX + idx * matchColWidth + matchColWidth / 2, y + 30);
            ctx.fillStyle = "#64748b";
            ctx.font = "11px monospace";
            ctx.fillText(`(${matchStat.kill}k)`, matchColStartX + idx * matchColWidth + matchColWidth / 2, y + 46);
          } else {
            ctx.fillStyle = "#475569";
            ctx.fillText("-", matchColStartX + idx * matchColWidth + matchColWidth / 2, y + 37);
          }
        });

        // Total Booyah
        ctx.textAlign = "center";
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 19px monospace";
        ctx.fillText(String(team.totalBooyah), statStartX + 45, y + 37);

        // Total Kill
        ctx.fillStyle = "#f87171";
        ctx.font = "bold 20px monospace";
        ctx.fillText(String(team.totalKill), statStartX + 155, y + 37);

        // Total Score
        ctx.fillStyle = "#facc15";
        ctx.font = "900 25px monospace";
        ctx.fillText(String(team.totalScore), startX + tableWidth - 75, y + 38);
      });

      // Footer
      ctx.fillStyle = "#64748b";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("HỆ THỐNG QUẢN LÝ ESPORTS • BẢNG ĐIỂM TỔNG HỢP TỰ ĐỘNG GARENA FREE FIRE", width / 2, height - 55);

      const link = document.createElement("a");
      link.download = `bang-tong-diem-${selectedMatchIds.length}-tran.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Đã tải ảnh bảng tổng điểm PNG thành công!");
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
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                Hệ Thống Tính Điểm Giải Đấu
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold normal-case">
                  Trực tiếp Garena
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Tự động trích xuất điểm từng trận, Tính tổng điểm 4-5 trận và Xuất ảnh PNG Full HD
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-2 w-full md:w-[320px] bg-background/80 border border-border/50">
            <TabsTrigger value="garena" className="gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold">
              <Flame className="w-4 h-4" /> Garena (Free)
            </TabsTrigger>
            <TabsTrigger value="vmnghia" className="gap-2 data-[state=active]:bg-primary font-semibold">
              <Zap className="w-4 h-4" /> Vmnghia API
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab 1: Garena Free */}
      {activeTab === "garena" && (
        <div className="space-y-6">
          {/* Search Card */}
          <Card className="border-amber-500/30 bg-gradient-to-b from-card/90 to-card/50 backdrop-blur-md shadow-2xl">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <CardTitle className="text-lg text-white font-bold">Tìm Kiếm Trận Đấu</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCookieSetting(!showCookieSetting)}
                  className="text-xs text-muted-foreground hover:text-white gap-1.5 h-8"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  {showCookieSetting ? "Ẩn cấu hình Session" : "Cấu hình Session Cookie"}
                </Button>
              </div>
              <CardDescription>
                Chọn ngày và khung giờ dễ dàng để quét toàn bộ các trận đấu Custom Room
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-5">
              {showCookieSetting && (
                <div className="p-3.5 rounded-lg bg-background/70 border border-amber-500/20 space-y-2 mb-2">
                  <Label htmlFor="cookie" className="text-xs font-semibold text-amber-300">
                    Garena Session Cookie (Tùy chọn ghi đè nếu phiên hết hạn)
                  </Label>
                  <Input 
                    id="cookie"
                    placeholder="session=...; session.sig=..."
                    value={customCookie}
                    onChange={(e) => handleCookieChange(e.target.value)}
                    className="text-xs font-mono bg-black/40 border-amber-500/20"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Mặc định hệ thống đã có sẵn Session Cookie. Chỉ thay đổi khi Garena báo lỗi phiên đăng nhập.
                  </p>
                </div>
              )}

              <form onSubmit={handleFindMatches} className="space-y-4">
                {/* Dòng 1: Account ID + Chọn Ngày Bắt Đầu & Kết Thúc + Chọn Giờ */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                  
                  {/* Account ID */}
                  <div className="md:col-span-3 space-y-1.5">
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
                  <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-foreground/90 font-medium text-xs flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> Ngày thi đấu <span className="text-amber-500">*</span>
                    </Label>
                    <div className="flex gap-1.5">
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
                  </div>

                  {/* Khung Giờ Bắt Đầu */}
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-foreground/90 font-medium text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Giờ bắt đầu <span className="text-amber-500">*</span>
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
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-foreground/90 font-medium text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Giờ kết thúc <span className="text-amber-500">*</span>
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
                  <div className="md:col-span-2">
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
              <div className="pt-3 border-t border-border/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Chọn nhanh khoảng thời gian (1 chạm):
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground mr-1">Gần nhất:</span>
                  {[
                    { label: "1 Giờ qua", hours: 1 },
                    { label: "3 Giờ qua", hours: 3 },
                    { label: "6 Giờ qua", hours: 6 },
                    { label: "12 Giờ qua", hours: 12 },
                    { label: "24 Giờ qua", hours: 24 },
                    { label: "3 Ngày qua", hours: 72 },
                    { label: "7 Ngày qua", hours: 168 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const past = new Date(now.getTime() - p.hours * 60 * 60 * 1000);
                        const pad = (n: number) => String(n).padStart(2, "0");
                        setStartDate(`${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}`);
                        setEndDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
                        setStartTime(`${pad(past.getHours())}:${pad(past.getMinutes())}`);
                        setEndTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
                        toast.info(`Đã đặt thời gian: ${p.label}`);
                      }}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-secondary/60 hover:bg-amber-500 hover:text-black border border-border/40 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] text-muted-foreground mr-1">Theo ca thi đấu:</span>
                  {[
                    { label: "Hôm nay (Cả ngày)", start: "00:00", end: "23:59", dayOffset: 0 },
                    { label: "Hôm qua (Cả ngày)", start: "00:00", end: "23:59", dayOffset: -1 },
                    { label: "Ca Chiều (13h - 17h)", start: "13:00", end: "17:00", dayOffset: 0 },
                    { label: "Ca Tối 1 (18h - 20h30)", start: "18:00", end: "20:30", dayOffset: 0 },
                    { label: "Ca Tối 2 (20h30 - 23h30)", start: "20:30", end: "23:30", dayOffset: 0 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        const target = new Date();
                        target.setDate(target.getDate() + p.dayOffset);
                        const pad = (n: number) => String(n).padStart(2, "0");
                        const dateStr = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
                        setStartDate(dateStr);
                        setEndDate(dateStr);
                        setStartTime(p.start);
                        setEndTime(p.end);
                        toast.info(`Đã chọn: ${p.label}`);
                      }}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-black border border-amber-500/30 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Buttons & Multi-Match Toolbar */}
              {matches.length > 0 && (
                <div className="pt-4 border-t border-border/40 space-y-3">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Tìm thấy {matches.length} trận đấu:
                    </Label>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAggregate(4, false)}
                        className="text-xs h-7 gap-1.5 border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black font-bold"
                      >
                        <Layers className="w-3.5 h-3.5" /> Tổng Hợp 4 Trận
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAggregate(5, true)}
                        className="text-xs h-7 gap-1.5 border-purple-500/40 text-purple-300 bg-purple-500/10 hover:bg-purple-500 hover:text-white font-bold"
                      >
                        <Crown className="w-3.5 h-3.5" /> Tổng Hợp 5 Trận (CPR)
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleQuickAggregate(matches.length, false)}
                        className="text-xs h-7 text-muted-foreground hover:text-white"
                      >
                        Chọn tất cả ({matches.length})
                      </Button>
                    </div>
                  </div>

                  {/* Match Badges List */}
                  <div className="flex flex-wrap gap-2">
                    {matches.map((m, idx) => {
                      const isSingleSelected = viewMode === "single" && selectedSingleMatchId === m.id;
                      const isMultiSelected = viewMode === "multi" && selectedMatchIds.includes(m.id);

                      return (
                        <div
                          key={m.id}
                          className={`rounded-lg transition-all duration-200 flex items-center border overflow-hidden ${
                            isSingleSelected
                              ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30 scale-105"
                              : isMultiSelected
                              ? "bg-purple-600/30 text-purple-200 border-purple-500 shadow-md"
                              : "bg-background/80 text-foreground border-border/60 hover:border-amber-500/60"
                          }`}
                        >
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

                          <button
                            type="button"
                            onClick={() => handleSelectSingleMatch(m.id)}
                            className="px-3 py-2 text-xs font-mono font-bold flex items-center gap-1.5"
                          >
                            <span>Trận #{idx + 1}</span>
                            <span className="opacity-75 font-sans font-normal text-[11px]">({formatUnixTime(m.startTime)})</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* VIEW MODE 1: SINGLE MATCH SCOREBOARD */}
          {viewMode === "single" && (
            loadingMatchDetails ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-card/20 rounded-2xl border border-border/30">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                  Đang trích xuất điểm số trận đấu từ Garena...
                </p>
              </div>
            ) : ranks.length > 0 ? (
              <Card className="border-border/60 bg-gradient-to-b from-card/90 to-card/60 backdrop-blur-md shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-border/40 pb-4 bg-black/40">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Medal className="w-6 h-6 text-amber-400" />
                        <CardTitle className="text-xl font-black uppercase text-white tracking-wide">
                          Bảng Điểm Chi Tiết Trận Đấu
                        </CardTitle>
                      </div>
                      <CardDescription className="font-mono text-xs mt-1">
                        Mã trận đấu: <span className="text-amber-400 font-bold">{selectedSingleMatchId}</span>
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowNames(!showNames)}
                        className="text-xs h-9 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                      >
                        {showNames ? "Ẩn Tên Tuyển Thủ (Hiện ID)" : "Hiện Tên Tuyển Thủ"}
                      </Button>
                      
                      {/* Nút Tải Ảnh PNG Full HD */}
                      <Button 
                        size="sm" 
                        disabled={exportingPng}
                        onClick={downloadSingleMatchPng}
                        className="text-xs h-9 gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase shadow-lg shadow-amber-500/25"
                      >
                        {exportingPng ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                        Tải Ảnh PNG (Full HD)
                      </Button>

                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.print()}
                        className="text-xs h-9 gap-1.5 border-border/60 text-white font-bold"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/60 border-b border-border/40 text-[11px] uppercase tracking-wider text-muted-foreground font-black">
                        <th className="py-3.5 px-4 text-center w-16">Hạng</th>
                        <th className="py-3.5 px-4 w-48">Tên Đội</th>
                        <th className="py-3.5 px-4">Thành Viên (Tuyển thủ)</th>
                        <th className="py-3.5 px-4 text-center w-24">Booyah!</th>
                        <th className="py-3.5 px-4 text-center w-24">Số Kill</th>
                        <th className="py-3.5 px-4 text-center w-28">Tổng Điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 text-sm">
                      {ranks.map((r, index) => {
                        const isTop1 = r.rank === 1;
                        const isTop2 = r.rank === 2;
                        const isTop3 = r.rank === 3;

                        return (
                          <tr 
                            key={r.rank}
                            className={`transition-colors hover:bg-white/[0.02] ${
                              isTop1 
                                ? "bg-amber-500/[0.08]" 
                                : isTop2 
                                ? "bg-slate-400/[0.05]" 
                                : isTop3 
                                ? "bg-amber-700/[0.05]" 
                                : ""
                            }`}
                          >
                            <td className="py-4 px-4 text-center font-black">
                              <span 
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${
                                  isTop1 
                                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/40" 
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

                            <td className="py-4 px-4">
                              <Input 
                                placeholder={`Đội slot #${r.rank}`}
                                value={r.teamName || ""}
                                onChange={(e) => handleSingleTeamNameChange(index, e.target.value)}
                                className="h-8 text-xs font-bold bg-background/50 border-border/40 focus-visible:ring-amber-500"
                              />
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1.5">
                                {showNames ? (
                                  r.accountNames.map((name, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-black/40 border border-border/40 text-xs font-medium text-foreground">
                                      {name}
                                    </span>
                                  ))
                                ) : (
                                  r.playerAccountIds.map((id, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-black/40 border border-border/40 text-xs font-mono text-muted-foreground">
                                      {id}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4 text-center">
                              {r.booyah > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                  <Sparkles className="w-3 h-3" /> Booyah!
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs font-mono">0</span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-sm text-red-400">
                                <Crosshair className="w-3.5 h-3.5" />
                                {r.kill}
                              </span>
                            </td>

                            <td className="py-4 px-4 text-center">
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

          {/* VIEW MODE 2: MULTI-MATCH AGGREGATED SCOREBOARD */}
          {viewMode === "multi" && (
            loadingMultiMatches ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-card/20 rounded-2xl border border-border/30">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                  Đang tính toán và tổng hợp điểm từ {selectedMatchIds.length} trận đấu...
                </p>
              </div>
            ) : aggregatedTeams.length > 0 ? (
              <Card className="border-purple-500/40 bg-gradient-to-b from-card/95 to-card/70 backdrop-blur-md shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-border/40 pb-4 bg-purple-950/20">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Crown className="w-6 h-6 text-yellow-400" />
                        <CardTitle className="text-xl font-black uppercase text-white tracking-wide">
                          Bảng Tổng Hợp Điểm ({selectedMatchIds.length} Trận)
                        </CardTitle>
                        {cprThreshold > 0 && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                            Chế độ Champion Rush
                          </span>
                        )}
                      </div>
                      <CardDescription className="text-xs mt-1">
                        Cộng dồn điểm số, số kill và thứ hạng qua {selectedMatchIds.length} trận đấu đã chọn
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Nút Tải Ảnh Tổng Hợp PNG Full HD */}
                      <Button 
                        size="sm" 
                        disabled={exportingPng}
                        onClick={downloadMultiMatchPng}
                        className="text-xs h-9 gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black uppercase shadow-lg shadow-purple-500/30"
                      >
                        {exportingPng ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                        Tải Ảnh Bảng Tổng (PNG)
                      </Button>

                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.print()}
                        className="text-xs h-9 gap-1.5 border-border/60 text-white font-bold"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/60 border-b border-border/40 text-[11px] uppercase tracking-wider text-muted-foreground font-black">
                        <th className="py-3.5 px-4 text-center w-16">Hạng</th>
                        <th className="py-3.5 px-4 w-44">Tên Đội</th>
                        <th className="py-3.5 px-4">Thành Viên</th>
                        {selectedMatchIds.map((mId, i) => (
                          <th key={mId} className="py-3.5 px-2.5 text-center text-[10px] w-20">
                            Trận #{i + 1}
                          </th>
                        ))}
                        <th className="py-3.5 px-3 text-center w-20">Booyah</th>
                        <th className="py-3.5 px-3 text-center w-20">Tổng Kill</th>
                        <th className="py-3.5 px-4 text-center w-28 bg-purple-500/10 text-purple-300">Tổng Điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 text-sm">
                      {aggregatedTeams.map((team, index) => {
                        const isTop1 = team.finalRank === 1;
                        const isTop2 = team.finalRank === 2;
                        const isTop3 = team.finalRank === 3;

                        return (
                          <tr 
                            key={team.teamKey}
                            className={`transition-colors hover:bg-white/[0.02] ${
                              isTop1 
                                ? "bg-amber-500/[0.08]" 
                                : isTop2 
                                ? "bg-slate-400/[0.05]" 
                                : isTop3 
                                ? "bg-amber-700/[0.05]" 
                                : ""
                            }`}
                          >
                            <td className="py-4 px-4 text-center font-black">
                              <span 
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${
                                  isTop1 
                                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/40" 
                                    : isTop2 
                                    ? "bg-slate-300 text-black" 
                                    : isTop3 
                                    ? "bg-amber-700 text-white" 
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                #{team.finalRank}
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              <Input 
                                placeholder={`Đội slot #${team.finalRank}`}
                                value={team.teamName || ""}
                                onChange={(e) => handleAggregatedTeamNameChange(index, e.target.value)}
                                className="h-8 text-xs font-bold bg-background/50 border-border/40 focus-visible:ring-purple-500"
                              />
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1">
                                {team.accountNames.map((name, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded bg-black/40 border border-border/30 text-[11px] font-medium">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {selectedMatchIds.map((mId) => {
                              const matchStat = team.matchScores[mId];
                              return (
                                <td key={mId} className="py-4 px-2.5 text-center font-mono text-xs">
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

                            <td className="py-4 px-3 text-center">
                              <span className="font-mono font-bold text-amber-400">{team.totalBooyah}</span>
                            </td>

                            <td className="py-4 px-3 text-center">
                              <span className="font-mono font-bold text-red-400">{team.totalKill}</span>
                            </td>

                            <td className="py-4 px-4 text-center bg-purple-500/10">
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
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card/20 rounded-2xl border border-dashed border-border/40 space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                <Search className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground">Chưa có dữ liệu trận đấu</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Hãy chọn ngày, khung giờ và bấm "Tìm trận" để xem chi tiết từng trận hoặc tính tổng điểm 4 trận, 5 trận Champion Rush.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Vmnghia API */}
      {activeTab === "vmnghia" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-5 space-y-6">
            <Card className="border-primary/20 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/50">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Kết Xuất Qua Vmnghia (Có Phí)
                </CardTitle>
                <CardDescription>Yêu cầu tài khoản Vmnghia còn số dư</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleVmnghiaSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scoreboardTypeId">Mẫu Bảng Điểm</Label>
                    <select
                      id="scoreboardTypeId"
                      value={vmnghiaForm.scoreboardTypeId}
                      onChange={(e) => setVmnghiaForm(prev => ({ ...prev, scoreboardTypeId: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {catalog.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name || item.code || `Mẫu #${item.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keyId">Key Dữ Liệu</Label>
                    <select
                      id="keyId"
                      value={vmnghiaForm.keyId}
                      onChange={(e) => setVmnghiaForm(prev => ({ ...prev, keyId: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">-- Không chọn --</option>
                      {keys.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.custom || item.keyValue}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idGame">ID Game (ID Phòng)</Label>
                    <Input 
                      id="idGame" 
                      placeholder="VD: 7476037837"
                      value={vmnghiaForm.idGame}
                      onChange={(e) => setVmnghiaForm(prev => ({ ...prev, idGame: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeStart">Bắt đầu</Label>
                      <Input 
                        id="timeStart" 
                        placeholder="YYYY/MM/DD HH:mm:ss"
                        value={vmnghiaForm.timeStart}
                        onChange={(e) => setVmnghiaForm(prev => ({ ...prev, timeStart: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeEnd">Kết thúc</Label>
                      <Input 
                        id="timeEnd" 
                        placeholder="YYYY/MM/DD HH:mm:ss"
                        value={vmnghiaForm.timeEnd}
                        onChange={(e) => setVmnghiaForm(prev => ({ ...prev, timeEnd: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={submittingVmnghia} className="w-full mt-4 font-bold">
                    {submittingVmnghia ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    Kết xuất ảnh
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-7">
            <Card className="border-primary/20 bg-card/40 backdrop-blur-sm shadow-xl min-h-[400px] flex flex-col justify-center items-center p-6">
              {vmnghiaResultImage ? (
                <img src={vmnghiaResultImage} alt="Kết quả" className="w-full h-auto rounded-lg" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Chưa có ảnh kết xuất</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
