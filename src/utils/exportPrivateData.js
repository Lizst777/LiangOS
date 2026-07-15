function throwIfError(result) {
  if (result.error) throw result.error;
  return result.data;
}

export async function exportPrivateData(supabase, userId) {
  const [noteResult, tracesResult, versionsResult] = await Promise.all([
    supabase
      .from("notes")
      .select("content, last_entry_date, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("moment_traces")
      .select(
        "content, weather_text, temperature, location, daypart, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("note_versions")
      .select("content, last_entry_date, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const payload = {
    schema: "liangos.private-data",
    version: 1,
    exported_at: new Date().toISOString(),
    note: throwIfError(noteResult),
    moment_traces: throwIfError(tracesResult) ?? [],
    note_versions: throwIfError(versionsResult) ?? [],
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
