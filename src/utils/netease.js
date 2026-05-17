import { NETEASE_PLAYLIST_ID } from "../constants/music";

const API_PREFIX = "/netease-api";

/**
 * 通过 Vite 开发/预览代理请求网易云公开接口。
 * 部署为纯静态站点时，需要自行配置同源反向代理到 music.163.com。
 */
export async function fetchPlaylist(playlistId = NETEASE_PLAYLIST_ID) {
  const url = `${API_PREFIX}/api/playlist/detail?id=${playlistId}&n=1000`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`请求失败 (${res.status})`);
  }

  const data = await res.json();

  if (data.code !== 200 || !data.result) {
    throw new Error(data.message || data.msg || "无法获取歌单数据");
  }

  return normalizePlaylist(data.result);
}

function normalizePlaylist(raw) {
  const tracks = (raw.tracks || []).map((track) => ({
    id: track.id,
    name: track.name,
    artists: (track.ar || track.artists || [])
      .map((artist) => artist.name)
      .filter(Boolean)
      .join(" / "),
    album: (track.al || track.album)?.name || "未知专辑",
  }));

  return {
    id: raw.id,
    name: raw.name,
    description: (raw.description || "").trim(),
    coverUrl: raw.coverImgUrl || raw.picUrl || "",
    trackCount: raw.trackCount ?? tracks.length,
    tracks,
  };
}

export function getPlaylistWebUrl(playlistId = NETEASE_PLAYLIST_ID) {
  return `https://music.163.com/#/playlist?id=${playlistId}`;
}

export function getSongWebUrl(songId) {
  return `https://music.163.com/#/song?id=${songId}`;
}

export function openInNetease(type, id) {
  const webUrl =
    type === "playlist" ? getPlaylistWebUrl(id) : getSongWebUrl(id);
  const clientUrl =
    type === "playlist" ? `orpheus://playlist/${id}` : `orpheus://song/${id}`;

  try {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = clientUrl;
    document.body.appendChild(iframe);
    window.setTimeout(() => {
      document.body.removeChild(iframe);
    }, 300);
  } catch {
    /* 客户端唤起失败时，保留网页跳转作为兜底。 */
  }

  window.setTimeout(() => {
    window.open(webUrl, "_blank", "noopener,noreferrer");
  }, 320);
}
