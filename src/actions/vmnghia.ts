"use server";

const API_BASE = "https://vmnghia.id.vn/api/v1/client-api";

async function vmnghiaRequest(endpoint: string, options: RequestInit = {}) {
  const token = process.env.VMNGHIA_API_TOKEN;
  
  if (!token) {
    throw new Error("Missing VMNGHIA_API_TOKEN in environment variables.");
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    // Adding no-store to avoid caching issues with server actions
    cache: "no-store", 
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Vmnghia API HTTP error ${response.status}`);
  }

  return payload.data ?? payload;
}

export async function getCatalog() {
  try {
    const catalog = await vmnghiaRequest("/catalog");
    return { success: true, data: catalog };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getKeys() {
  try {
    const keys = await vmnghiaRequest("/keys");
    return { success: true, data: keys };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createScoreboard(data: {
  scoreboardTypeId: number;
  idGame: string;
  timeStart: string;
  timeEnd: string;
  matchRemoval?: number;
  cpr?: number;
  keyId?: number;
}) {
  try {
    const order = await vmnghiaRequest("/scoreboards", {
      method: "POST",
      body: JSON.stringify({
        scoreboardTypeId: data.scoreboardTypeId,
        idGame: data.idGame,
        timeStart: data.timeStart,
        timeEnd: data.timeEnd,
        matchRemoval: data.matchRemoval || 0,
        cpr: data.cpr || 0,
        keyId: data.keyId,
      }),
    });
    return { success: true, data: order };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
