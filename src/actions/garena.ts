"use server";

const GARENA_BASE = "https://congdong.ff.garena.vn/league-score-api";

function getGarenaHeaders(customCookie?: string) {
  const cookie = customCookie || process.env.GARENA_SESSION_COOKIE || "";
  return {
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json",
    "cookie": cookie,
    "origin": "https://congdong.ff.garena.vn",
    "referer": "https://congdong.ff.garena.vn/tinh-diem",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
}

export async function findGarenaMatches(data: {
  accountId: string;
  startTime: number; // Unix timestamp in seconds
  endTime: number;   // Unix timestamp in seconds
  cookie?: string;
}) {
  try {
    const response = await fetch(`${GARENA_BASE}/player/find-match`, {
      method: "POST",
      headers: getGarenaHeaders(data.cookie),
      body: JSON.stringify({
        accountId: data.accountId.trim(),
        startTime: data.startTime,
        endTime: data.endTime,
      }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: payload.message || `Lỗi từ Garena HTTP ${response.status}. Có thể session đã hết hạn.` };
    }

    return { success: true, matches: payload.matches || [] };
  } catch (error: any) {
    return { success: false, error: error.message || "Không thể kết nối đến máy chủ Garena." };
  }
}

export async function getGarenaMatchDetails(data: {
  matchId: string;
  cookie?: string;
}) {
  try {
    const response = await fetch(`${GARENA_BASE}/match`, {
      method: "POST",
      headers: getGarenaHeaders(data.cookie),
      body: JSON.stringify({
        matchId: data.matchId.trim(),
      }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: payload.message || `Lỗi lấy chi tiết trận HTTP ${response.status}.` };
    }

    return { success: true, match: payload.match };
  } catch (error: any) {
    return { success: false, error: error.message || "Không thể lấy chi tiết trận đấu từ Garena." };
  }
}
