import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  getDailyQuote,
  getMillisecondsUntilTomorrow,
} from "../data/dailyQuotes";
import { useOwnerSession } from "../hooks/useOwnerSession";
import { getDaypart } from "../utils/daypart";

const MomentArchive = lazy(() => import("./MomentArchive"));

function MomentText({ weather, daypart }) {
  const { client: supabase, isReady, user } = useOwnerSession();
  const [quoteDate, setQuoteDate] = useState(() => new Date());
  const [saveState, setSaveState] = useState("idle");
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [hasOpenedArchive, setHasOpenedArchive] = useState(false);
  const [archiveRefreshKey, setArchiveRefreshKey] = useState(0);
  const statusTimerRef = useRef(null);
  const lastSavedMomentRef = useRef(null);
  const userId = user?.id ?? null;
  const dailyQuote = getDailyQuote(quoteDate);
  const moment = dailyQuote.content;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuoteDate(new Date());
    }, getMillisecondsUntilTomorrow());

    return () => window.clearTimeout(timeout);
  }, [dailyQuote.dateKey]);

  useEffect(() => {
    if (!isReady || !userId || !supabase) return undefined;

    let active = true;
    lastSavedMomentRef.current = null;
    async function checkSavedQuote() {
      try {
        let { data, error } = await supabase
          .from("moment_traces")
          .select("quote_date")
          .eq("user_id", userId)
          .eq("quote_date", dailyQuote.dateKey)
          .limit(1)
          .maybeSingle();

        if (isMissingQuoteMetadata(error)) {
          ({ data, error } = await supabase
            .from("moment_traces")
            .select("content")
            .eq("user_id", userId)
            .eq("content", moment)
            .limit(1)
            .maybeSingle());
        }

        if (!active || error || !data) return;
        lastSavedMomentRef.current = dailyQuote.dateKey;
      } catch {
        // Saving remains available when the duplicate check is unavailable.
      }
    }

    checkSavedQuote();

    return () => {
      active = false;
    };
  }, [dailyQuote.dateKey, isReady, moment, userId, supabase]);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
    };
  }, []);

  function showSaveState(value) {
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);

    setSaveState(value);
    if (value !== "saving") {
      statusTimerRef.current = window.setTimeout(() => setSaveState("idle"), 1800);
    }
  }

  async function saveMoment() {
    if (!user || saveState === "saving") return;
    if (lastSavedMomentRef.current === dailyQuote.dateKey) {
      showSaveState("saved");
      return;
    }
    if (!supabase) {
      showSaveState("error");
      return;
    }

    showSaveState("saving");

    try {
      const trace = {
        user_id: user.id,
        content: moment,
        weather_text: weather?.text ?? null,
        temperature:
          weather?.temperature === null || weather?.temperature === undefined
            ? null
            : String(weather.temperature),
        location: weather?.location ?? null,
        daypart: daypart ?? getDaypart(),
        quote_date: dailyQuote.dateKey,
        quote_author: dailyQuote.author,
        quote_source: dailyQuote.source,
        quote_source_url: dailyQuote.sourceUrl,
      };

      let { error } = await supabase
        .from("moment_traces")
        .upsert(trace, { onConflict: "user_id,quote_date" });

      if (isMissingQuoteMetadata(error)) {
        const legacyTrace = {
          user_id: trace.user_id,
          content: trace.content,
          weather_text: trace.weather_text,
          temperature: trace.temperature,
          location: trace.location,
          daypart: trace.daypart,
        };
        ({ error } = await supabase.from("moment_traces").insert(legacyTrace));
      }

      if (error) {
        showSaveState("error");
        return;
      }

      lastSavedMomentRef.current = dailyQuote.dateKey;
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
        <blockquote className="moment-quote" lang="zh-CN">
          <span className="moment-quote__text" key={dailyQuote.dateKey}>
            {moment}
          </span>
        </blockquote>
        <figcaption className="moment-meta" lang="zh-CN">
          <span className="moment-byline">
            <span className="moment-author">{dailyQuote.author}</span>
            <span className="moment-source">{dailyQuote.source}</span>
          </span>
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

function isMissingQuoteMetadata(error) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /quote_(date|author|source)/i.test(error.message ?? "")
  );
}

export default MomentText;
