import { useEffect, useMemo, useState } from "react";
import { NETEASE_PLAYLIST_ID } from "../../constants/music";
import Button from "../../ui/Button";
import {
  fetchPlaylist,
  getPlaylistWebUrl,
  openInNetease,
} from "../../utils/netease";

const PLAYLIST_TITLE = "网易云音乐空间";
const PLAYLIST_INTRO =
  "把 LiangOS 里的音乐入口做成一个干净、克制的歌单空间。这里保留网易云歌单跳转能力，歌曲明细会在真实歌单数据接入后自动呈现。";

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

  const tracks = playlist?.tracks ?? [];
  const playlistUrl = useMemo(
    () => getPlaylistWebUrl(NETEASE_PLAYLIST_ID),
    [],
  );
  const hasRealTracks = tracks.length > 0;
  const isLoading = status === "loading";

  return (
    <div className="music-space">
      <header className="music-hero" aria-labelledby="music-space-title">
        <div className="music-hero__cover-wrap">
          {playlist?.coverUrl ? (
            <img
              className="music-hero__cover"
              src={playlist.coverUrl}
              alt="网易云音乐空间歌单封面"
              width={196}
              height={196}
            />
          ) : (
            <div className="music-hero__cover music-hero__cover--placeholder">
              <span>LiangOS</span>
            </div>
          )}
        </div>

        <div className="music-hero__content">
          <span className="music-hero__eyebrow">Playlist</span>
          <h2 id="music-space-title" className="music-hero__title">
            {PLAYLIST_TITLE}
          </h2>
          <div className="music-hero__meta">
            <span>歌单 ID</span>
            <strong>{NETEASE_PLAYLIST_ID}</strong>
          </div>
          <p className="music-hero__desc">
            {playlist?.description?.trim() || PLAYLIST_INTRO}
          </p>
          <div className="music-hero__actions">
            <Button
              type="button"
              className="music-hero__button"
              onClick={() => openInNetease("playlist", NETEASE_PLAYLIST_ID)}
            >
              打开网易云歌单
            </Button>
            <a
              className="music-hero__link"
              href={playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              网页链接
            </a>
          </div>
        </div>
      </header>

      <section className="music-panel" aria-labelledby="music-track-list-title">
        <div className="music-panel__header">
          <div>
            <span className="music-panel__eyebrow">Tracks</span>
            <h3 id="music-track-list-title" className="music-panel__title">
              歌曲列表
            </h3>
          </div>
          <span className="music-panel__count">
            {hasRealTracks ? `${tracks.length} 首` : "等待数据"}
          </span>
        </div>

        <div className="music-track-table" role="table" aria-label="歌曲列表">
          <div className="music-track-table__head" role="row">
            <span>序号</span>
            <span>歌名</span>
            <span>歌手</span>
            <span>专辑</span>
            <span>操作</span>
          </div>

          {hasRealTracks ? (
            tracks.map((track, index) => (
              <div className="music-track" role="row" key={track.id}>
                <span className="music-track__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="music-track__name" title={track.name}>
                  {track.name}
                </span>
                <span className="music-track__artist" title={track.artists}>
                  {track.artists || "未知歌手"}
                </span>
                <span className="music-track__album" title={track.album}>
                  {track.album || "未知专辑"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="music-track__open"
                  onClick={() => openInNetease("song", track.id)}
                >
                  打开网易云
                </Button>
              </div>
            ))
          ) : (
            <div className="music-empty">
              <p className="music-empty__title">
                {isLoading ? "正在连接网易云歌单" : "等待接入真实歌单数据"}
              </p>
              <p className="music-empty__desc">
                当前不会使用模拟歌曲填充列表；真实数据可用后，这里会显示歌名、歌手、专辑和打开网易云操作。
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default MusicView;
