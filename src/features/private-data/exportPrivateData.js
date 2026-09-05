import { isMissingQuoteMetadata } from "../moments/momentTraceRepository";
import { getLocalDateKey } from "../../utils/date";

function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}

async function loadMomentTraces(client, userId) {
  let result = await client
    .from("moment_traces")
    .select(
      "content, weather_text, temperature, location, daypart, created_at, quote_date, quote_author, quote_source, quote_source_url",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (isMissingQuoteMetadata(result.error)) {
    result = await client
      .from("moment_traces")
      .select("content, weather_text, temperature, location, daypart, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  }

  return result;
}

async function loadPrivateData(client, userId) {
  const [notes, traces, versions, legacyNote] = await Promise.all([
    client
      .from("daily_notes")
      .select("content, entry_date, created_at, updated_at")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false }),
    loadMomentTraces(client, userId),
    client
      .from("daily_note_versions")
      .select("content, entry_date, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    client
      .from("notes")
      .select("content, last_entry_date, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    dailyNotes: unwrap(notes) ?? [],
    dailyNoteVersions: unwrap(versions) ?? [],
    legacyNote: unwrap(legacyNote),
    momentTraces: unwrap(traces) ?? [],
  };
}

function createTimeline(dailyNotes, momentTraces) {
  return [
    ...dailyNotes.map((note) => ({
      type: "note",
      occurred_at: note.updated_at,
      entry_date: note.entry_date,
      content: note.content,
    })),
    ...momentTraces.map((trace) => ({
      type: "moment",
      occurred_at: trace.created_at,
      entry_date: getLocalDateKey(trace.created_at),
      content: trace.content,
      weather_text: trace.weather_text,
      temperature: trace.temperature,
      location: trace.location,
      daypart: trace.daypart,
      quote_date: trace.quote_date ?? null,
      quote_author: trace.quote_author ?? null,
      quote_source: trace.quote_source ?? null,
      quote_source_url: trace.quote_source_url ?? null,
    })),
  ].sort((left, right) => new Date(right.occurred_at) - new Date(left.occurred_at));
}

function downloadJson(payload) {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = `liangos-export-${date}.json`;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportPrivateData(client, userId) {
  const { dailyNotes, dailyNoteVersions, legacyNote, momentTraces } =
    await loadPrivateData(client, userId);

  downloadJson({
    schema: "liangos.private-data",
    version: 3,
    exported_at: new Date().toISOString(),
    timeline: createTimeline(dailyNotes, momentTraces),
    daily_notes: dailyNotes,
    moment_traces: momentTraces,
    daily_note_versions: dailyNoteVersions,
    legacy_note: legacyNote,
  });
}
