import { lazy, Suspense, useCallback, useState } from "react";
import { useDailyMoment } from "./useDailyMoment";

const MomentArchive = lazy(() => import("./MomentArchive"));

function MomentText({ weather, daypart }) {
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [hasOpenedArchive, setHasOpenedArchive] = useState(false);
  const [archiveRefreshKey, setArchiveRefreshKey] = useState(0);

  const handleSaved = useCallback(() => {
    setArchiveRefreshKey((value) => value + 1);
  }, []);

  const { dailyQuote, isSaving, save, saveLabel, user } = useDailyMoment({
    daypart,
    onSaved: handleSaved,
    weather,
  });

  const closeArchive = useCallback(() => setIsArchiveOpen(false), []);

  function openArchive() {
    setHasOpenedArchive(true);
    setIsArchiveOpen(true);
  }

  return (
    <>
      <figure className="moment">
        <blockquote className="moment-quote" lang="zh-CN">
          <span className="moment-quote__text" key={dailyQuote.dateKey}>
            {dailyQuote.content}
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
                onClick={() => void save()}
                disabled={isSaving}
                aria-label={saveLabel}
                aria-live="polite"
                title="保存"
              >
                {saveLabel}
              </button>
              <span className="moment-divider" aria-hidden>
                ·
              </span>
              <button className="moment-action" type="button" onClick={openArchive}>
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
