import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOwnerSession } from "../hooks/useOwnerSession";
import { supabase } from "../lib/supabase";
import { getDaypart } from "../utils/daypart";
import { prefersReducedMotion } from "../utils/gsapMotion";

const MomentArchive = lazy(() => import("./MomentArchive"));

const MOMENT_AUTHOR = "此刻";

const MOMENTS = {
  morning: ["天刚亮。", "房间醒了。", "光进来了。", "早晨还很轻。"],
  day: ["屏幕亮着。", "时间经过这里。", "外面正忙。", "这里没有催促。"],
  evening: ["天色慢了。", "声音变轻了。", "光还没走。", "今天还在。"],
  night: ["现在很安静。", "夜里没有回声。", "灯还亮着。", "时间慢了一点。"],
};

function getMomentAfter(current, daypart = getDaypart()) {
  const pool = MOMENTS[daypart] ?? MOMENTS.day;
  const choices = pool.filter((item) => item !== current);
  return choices[Math.floor(Math.random() * choices.length)] ?? pool[0];
}

function isChineseMoment(value) {
  return typeof value === "string" && /[\u3400-\u9fff]/.test(value);
}

function MomentText({ weather, daypart }) {
  const { isReady, user } = useOwnerSession();
  const [momentState, setMomentState] = useState(() => ({
    content: getMomentAfter("", daypart),
    ownerId: null,
  }));
  const [saveState, setSaveState] = useState("idle");
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [hasOpenedArchive, setHasOpenedArchive] = useState(false);
  const [archiveRefreshKey, setArchiveRefreshKey] = useState(0);
  const quoteRef = useRef(null);
  const statusTimerRef = useRef(null);
  const motionFrameRef = useRef(null);
  const lastSavedMomentRef = useRef(null);
  const userId = user?.id ?? null;
  const localFallback = useMemo(() => getMomentAfter("", daypart), [daypart]);
  const moment =
    momentState.ownerId && momentState.ownerId !== userId
      ? localFallback
      : momentState.content;

  useEffect(() => {
    if (!isReady) return undefined;

    let active = true;
    lastSavedMomentRef.current = null;
    async function loadMoment() {
      if (!supabase) return;

      try {
        const query = userId
          ? supabase
              .from("moment_traces")
              .select("content")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : supabase
              .from("moments")
              .select("content")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
        const { data, error } = await query;

        if (!active || error || !isChineseMoment(data?.content)) return;
        if (userId) lastSavedMomentRef.current = data.content;
        setMomentState({ content: data.content, ownerId: userId });
      } catch {
        // The local sentence remains visible when Supabase is unavailable.
      }
    }

    loadMoment();

    return () => {
      active = false;
    };
  }, [isReady, userId]);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
      if (motionFrameRef.current) window.cancelAnimationFrame(motionFrameRef.current);
    };
  }, []);

  function showSaveState(value) {
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);

    setSaveState(value);
    if (value !== "saving") {
      statusTimerRef.current = window.setTimeout(() => setSaveState("idle"), 1800);
    }
  }

  function nextMoment() {
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
    setSaveState("idle");
    setMomentState({ content: getMomentAfter(moment, daypart), ownerId: null });

    if (!quoteRef.current || prefersReducedMotion()) return;
    if (motionFrameRef.current) window.cancelAnimationFrame(motionFrameRef.current);

    motionFrameRef.current = window.requestAnimationFrame(() => {
      void import("gsap")
        .then(({ default: gsap }) => {
          if (!quoteRef.current) return;
          gsap.fromTo(
            quoteRef.current,
            { autoAlpha: 0.76, y: 3 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.22,
              ease: "power2.out",
              overwrite: "auto",
            },
          );
        })
        .catch(() => undefined);
    });
  }

  async function saveMoment() {
    if (!user || saveState === "saving") return;
    if (lastSavedMomentRef.current === moment) {
      showSaveState("saved");
      return;
    }
    if (!supabase) {
      showSaveState("error");
      return;
    }

    showSaveState("saving");

    try {
      const { error } = await supabase.from("moment_traces").insert({
        user_id: user.id,
        content: moment,
        weather_text: weather?.text ?? null,
        temperature: weather?.temperature ? String(weather.temperature) : null,
        location: weather?.location ?? null,
        daypart: daypart ?? getDaypart(),
      });

      if (error) {
        showSaveState("error");
        return;
      }

      lastSavedMomentRef.current = moment;
      setArchiveRefreshKey((value) => value + 1);
      showSaveState("saved");
    } catch {
      showSaveState("error");
    }
  }

  const closeArchive = useCallback(() => setIsArchiveOpen(false), []);
  const saveLabel = {
    idle: "保存",
    saving: "保存中",
    saved: "已保存",
    error: "未保存",
  }[saveState];

  return (
    <>
      <figure className="moment">
        <button
          className="moment-quote"
          type="button"
          onClick={nextMoment}
          ref={quoteRef}
          lang="zh-CN"
        >
          {moment}
        </button>
        <figcaption className="moment-meta" lang="zh-CN">
          <span className="moment-author">{MOMENT_AUTHOR}</span>
          {user && (
            <>
              <span className="moment-divider" aria-hidden>
                ·
              </span>
              <button
                className="moment-action moment-action--save"
                type="button"
                onClick={saveMoment}
                disabled={saveState === "saving"}
                aria-label={saveLabel}
                title="保存"
                aria-live="polite"
              >
                {saveLabel}
              </button>
              <span className="moment-divider" aria-hidden>
                ·
              </span>
              <button
                className="moment-action"
                type="button"
                onClick={() => {
                  setHasOpenedArchive(true);
                  setIsArchiveOpen(true);
                }}
              >
                痕迹
              </button>
            </>
          )}
        </figcaption>
      </figure>

      {user && hasOpenedArchive && (
        <Suspense fallback={null}>
          <MomentArchive
            isOpen={isArchiveOpen}
            onClose={closeArchive}
            refreshKey={archiveRefreshKey}
          />
        </Suspense>
      )}
    </>
  );
}

export default MomentText;
