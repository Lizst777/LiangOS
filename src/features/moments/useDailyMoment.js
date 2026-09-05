import { useEffect, useRef, useState } from "react";
import { getDailyQuote, getMillisecondsUntilTomorrow } from "../../data/dailyQuotes";
import { useOwnerSession } from "../../hooks/useOwnerSession";
import { getDaypart } from "../../utils/daypart";
import { findSavedQuote, saveMomentTrace } from "./momentTraceRepository";

const SAVE_LABELS = {
  error: "未保存",
  idle: "保存",
  saved: "已保存",
  saving: "保存中",
};

function createTrace({ dailyQuote, daypart, userId, weather }) {
  return {
    content: dailyQuote.content,
    daypart: daypart ?? getDaypart(),
    location: weather?.location ?? null,
    quote_author: dailyQuote.author,
    quote_date: dailyQuote.dateKey,
    quote_source: dailyQuote.source,
    quote_source_url: dailyQuote.sourceUrl,
    temperature:
      weather?.temperature === null || weather?.temperature === undefined
        ? null
        : String(weather.temperature),
    user_id: userId,
    weather_text: weather?.text ?? null,
  };
}

export function useDailyMoment({ daypart, onSaved, weather }) {
  const { client, isReady, user } = useOwnerSession();
  const [quoteDate, setQuoteDate] = useState(() => new Date());
  const [saveState, setSaveState] = useState("idle");
  const statusTimerRef = useRef(null);
  const savedQuoteDateRef = useRef(null);
  const dailyQuote = getDailyQuote(quoteDate);
  const userId = user?.id ?? null;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuoteDate(new Date());
    }, getMillisecondsUntilTomorrow());

    return () => window.clearTimeout(timeout);
  }, [dailyQuote.dateKey]);

  useEffect(() => {
    if (!isReady || !userId || !client) return undefined;

    let isActive = true;
    savedQuoteDateRef.current = null;

    async function checkSavedQuote() {
      try {
        const { data, error } = await findSavedQuote(client, {
          content: dailyQuote.content,
          quoteDate: dailyQuote.dateKey,
          userId,
        });

        if (isActive && !error && data) {
          savedQuoteDateRef.current = dailyQuote.dateKey;
        }
      } catch {
        // Saving remains available when the duplicate check is unavailable.
      }
    }

    void checkSavedQuote();

    return () => {
      isActive = false;
    };
  }, [client, dailyQuote.content, dailyQuote.dateKey, isReady, userId]);

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

  async function save() {
    if (!userId || saveState === "saving") return;

    if (savedQuoteDateRef.current === dailyQuote.dateKey) {
      showSaveState("saved");
      return;
    }

    if (!client) {
      showSaveState("error");
      return;
    }

    showSaveState("saving");

    try {
      const trace = createTrace({ dailyQuote, daypart, userId, weather });
      const { error } = await saveMomentTrace(client, trace);

      if (error) {
        showSaveState("error");
        return;
      }

      savedQuoteDateRef.current = dailyQuote.dateKey;
      onSaved?.();
      showSaveState("saved");
    } catch {
      showSaveState("error");
    }
  }

  return {
    dailyQuote,
    isSaving: saveState === "saving",
    save,
    saveLabel: SAVE_LABELS[saveState],
    user,
  };
}
