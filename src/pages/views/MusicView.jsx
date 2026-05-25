import { useEffect, useMemo, useState } from "react";
import { NETEASE_PLAYLIST_ID } from "../../constants/music";
import {
  fetchPlaylist,
  getPlaylistWebUrl,
  openInNetease,
} from "../../utils/netease";

function MusicView() {
  const [playlist, setPlaylist] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadPlaylist() {
      try {
        const data = await fetchPlaylist(NETEASE_PLAYLIST_ID);
        if (!cancelled) {
          setPlaylist(data);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setPlaylist(null);
          setStatus("waiting");
        }
      }
    }

    loadPlaylist();

    return () => {
      cancelled = true;
    };
  }, []);

  const playlistUrl = useMemo(() => getPlaylistWebUrl(NETEASE_PLAYLIST_ID), []);
  const tracks = playlist?.tracks ?? [];
  const hasRealTracks = tracks.length > 0;
  const currentTrack = tracks[0];

  return (
    <main className="music-surface page-scroll" aria-label="Music">
      <section className="music-surface__now">
        <p className="editorial-kicker">Now Playing</p>
        <h2 className="music-surface__title">
          {currentTrack?.name || playlist?.title || "网易云音乐空间"}
        </h2>
        <p className="music-surface__artist">
          {currentTrack?.artists || `Playlist ${NETEASE_PLAYLIST_ID}`}
        </p>
        <div className="editorial-actions">
          <button
            type="button"
            onClick={() => openInNetease("playlist", NETEASE_PLAYLIST_ID)}
          >
            Open
          </button>
          <a href={playlistUrl} target="_blank" rel="noopener noreferrer">
            Web
          </a>
        </div>
      </section>

      {hasRealTracks ? (
        <ol className="editorial-list music-surface__tracks">
          {tracks.map((track, index) => (
            <li key={track.id} className="editorial-list__item">
              <button type="button" onClick={() => openInNetease("song", track.id)}>
                <span>
                  {String(index + 1).padStart(2, "0")} · {track.name}
                </span>
                <small>
                  {track.artists || "Unknown"} · {track.album || "Unknown album"}
                </small>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="editorial-empty">
          {status === "loading" ? "Connecting playlist." : "等待接入真实歌单数据"}
        </p>
      )}
    </main>
  );
}

export default MusicView;
