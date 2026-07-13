import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useOwnerSession } from "../hooks/useOwnerSession";
import { supabase } from "../lib/supabase";
import { IconClose } from "./Icons";

const traceDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "long",
  year: "numeric",
});

function formatWeather(trace) {
  return [
    trace.temperature ? `${trace.temperature}°C` : null,
    trace.weather_text,
    trace.location,
  ]
    .filter(Boolean)
    .join(" · ");
}

function MomentArchive({ isOpen, onClose, refreshKey }) {
  const { user } = useOwnerSession();
  const [traces, setTraces] = useState([]);
  const [loadState, setLoadState] = useState("idle");

  useEffect(() => {
    if (!isOpen || !supabase || !user) return undefined;

    let isActive = true;

    async function loadTraces() {
      setLoadState("loading");

      const { data, error } = await supabase
        .from("moment_traces")
        .select("id, content, weather_text, temperature, location, created_at")
        .order("created_at", { ascending: false })
        .limit(120);

      if (!isActive) return;

      if (error) {
        setLoadState("error");
        return;
      }

      setTraces(data ?? []);
      setLoadState("ready");
    }

    loadTraces();

    return () => {
      isActive = false;
    };
  }, [isOpen, refreshKey, user]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.section
          className="moment-archive"
          role="dialog"
          aria-modal="true"
          aria-labelledby="moment-archive-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="moment-archive__inner"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.24 }}
          >
            <header className="moment-archive__header">
              <h2 id="moment-archive-title">痕迹</h2>
              <button
                className="moment-archive__close"
                type="button"
                onClick={onClose}
                aria-label="关闭痕迹"
                title="关闭"
              >
                <IconClose />
              </button>
            </header>

            <div className="moment-archive__list">
              {loadState === "loading" && <p className="moment-archive__empty">正在读取。</p>}
              {loadState === "error" && <p className="moment-archive__empty">暂时无法抵达。</p>}
              {loadState === "ready" && traces.length === 0 && (
                <p className="moment-archive__empty">还没有留下什么。</p>
              )}
              {traces.map((trace) => {
                const weather = formatWeather(trace);

                return (
                  <article className="moment-trace" key={trace.id}>
                    <time dateTime={trace.created_at}>
                      {traceDateFormatter.format(new Date(trace.created_at))}
                    </time>
                    <p>{trace.content}</p>
                    {weather && <span>{weather}</span>}
                  </article>
                );
              })}
            </div>
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>,
    document.querySelector(".liangos-app") ?? document.body,
  );
}

export default MomentArchive;
