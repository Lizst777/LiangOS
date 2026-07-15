function throwIfError(result) {
  if (result.error) throw result.error;
  return result.data;
}

function getLocalDateKey(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function exportPrivateData(supabase, userId) {
  const [notesResult, tracesResult, versionsResult, legacyNoteResult] = await Promise.all([
    supabase
      .from("daily_notes")
      .select("content, entry_date, created_at, updated_at")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false }),
    supabase
      .from("moment_traces")
      .select(
        "content, weather_text, temperature, location, daypart, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("daily_note_versions")
      .select("content, entry_date, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("notes")
      .select("content, last_entry_date, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const dailyNotes = throwIfError(notesResult) ?? [];
  const momentTraces = throwIfError(tracesResult) ?? [];
  const dailyNoteVersions = throwIfError(versionsResult) ?? [];
  const legacyNote = throwIfError(legacyNoteResult);
  const timeline = [
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
    })),
  ].sort((left, right) => new Date(right.occurred_at) - new Date(left.occurred_at));

  const payload = {
    schema: "liangos.private-data",
    version: 2,
    exported_at: new Date().toISOString(),
    timeline,
    daily_notes: dailyNotes,
    moment_traces: momentTraces,
    daily_note_versions: dailyNoteVersions,
    legacy_note: legacyNote,
  };

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
