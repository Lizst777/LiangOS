import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { supabase } from "../lib/supabase";

const MOMENT_AUTHOR = "此刻";

const MOMENTS = [
  "现在很安静。",
  "今天还没有结束。",
  "屏幕亮着。",
  "这里暂时没有别的事。",
  "时间慢了一点。",
  "你又回来了。",
  "外面的声音变轻了。",
  "光还停在这里。",
  "房间没有催促。",
  "这一刻很轻。",
];

function getMomentAfter(current) {
  if (MOMENTS.length < 2) return MOMENTS[0];

  let next = current;
  while (next === current) {
    next = MOMENTS[Math.floor(Math.random() * MOMENTS.length)];
  }

  return next;
}

function MomentText() {
  const [moment, setMoment] = useState(() => getMomentAfter(""));
  const [saveState, setSaveState] = useState("idle");
  const quoteRef = useRef(null);
  const statusTimerRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadMoment() {
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from("moments")
          .select("content")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!active || error || !data?.content) return;
        setMoment(data.content);
      } catch {
        // Local copy remains visible if Supabase is unavailable.
      }
    }

    loadMoment();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  function showSaveState(value) {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }

    setSaveState(value);
    if (value !== "saving") {
      statusTimerRef.current = setTimeout(() => setSaveState("idle"), 1800);
    }
  }

  function nextMoment() {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    setSaveState("idle");

    if (quoteRef.current) {
      gsap.fromTo(
        quoteRef.current,
        { autoAlpha: 0.72, y: 3 },
        { autoAlpha: 1, y: 0, duration: 0.22, ease: "power2.out", overwrite: "auto" },
      );
    }

    setMoment((current) => getMomentAfter(current));
  }

  async function saveMoment() {
    if (saveState === "saving") return;

    if (!supabase) {
      showSaveState("error");
      return;
    }

    showSaveState("saving");

    try {
      const { error } = await supabase.from("moments").insert({ content: moment });
      showSaveState(error ? "error" : "saved");
    } catch {
      showSaveState("error");
    }
  }

  const saveLabel = {
    idle: "保存",
    saving: "保存中",
    saved: "已保存",
    error: "未保存",
  }[saveState];

  return (
    <figure className="moment">
      <button className="moment-quote" type="button" onClick={nextMoment} ref={quoteRef}>
        {moment}
      </button>
      <figcaption className="moment-meta">
        <span className="moment-author">{MOMENT_AUTHOR}</span>
        <span className="moment-divider" aria-hidden>
          ·
        </span>
        <button
          className="moment-save"
          type="button"
          onClick={saveMoment}
          disabled={saveState === "saving"}
          aria-label={saveLabel}
          title="保存"
          aria-live="polite"
        >
          {saveLabel}
        </button>
      </figcaption>
    </figure>
  );
}

export default MomentText;
