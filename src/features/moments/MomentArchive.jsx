import { useEffect, useState } from "react";
import PrivateDialog from "../../components/layout/PrivateDialog";
import { useOwnerSession } from "../../hooks/useOwnerSession";
import MomentTraceItem from "./MomentTraceItem";
import { loadMomentTraces } from "./momentTraceRepository";

const EMPTY_MESSAGES = {
  error: "暂时无法抵达。",
  loading: "正在读取。",
  ready: "还没有留下什么。",
};

function MomentArchive({ isOpen, onClose, refreshKey }) {
  const { client, user } = useOwnerSession();
  const [traces, setTraces] = useState([]);
  const [loadState, setLoadState] = useState("idle");
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isOpen || !client || !userId) return undefined;

    let isActive = true;

    async function loadTraces() {
      setLoadState("loading");
      const { data, error } = await loadMomentTraces(client, userId);

      if (!isActive) return;

      if (error) {
        setLoadState("error");
        return;
      }

      setTraces(data ?? []);
      setLoadState("ready");
    }

    void loadTraces();

    return () => {
      isActive = false;
    };
  }, [client, isOpen, refreshKey, userId]);

  function updateTrace(updatedTrace) {
    setTraces((current) =>
      current.map((trace) =>
        trace.id === updatedTrace.id
          ? { ...trace, content: updatedTrace.content }
          : trace,
      ),
    );
  }

  function removeTrace(id) {
    setTraces((current) => current.filter((trace) => trace.id !== id));
  }

  const showEmptyMessage =
    loadState === "error" ||
    (loadState === "loading" && traces.length === 0) ||
    (loadState === "ready" && traces.length === 0);

  return (
    <PrivateDialog
      className="moment-archive"
      title="痕迹"
      closeLabel="关闭痕迹"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="moment-archive__list">
        {showEmptyMessage && (
          <p className="moment-archive__empty">{EMPTY_MESSAGES[loadState]}</p>
        )}

        {traces.map((trace) => (
          <MomentTraceItem
            client={client}
            key={trace.id}
            onDeleted={removeTrace}
            onUpdated={updateTrace}
            trace={trace}
            userId={userId}
          />
        ))}
      </div>
    </PrivateDialog>
  );
}

export default MomentArchive;
