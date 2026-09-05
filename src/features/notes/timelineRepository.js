function mergeTimeline(entries, versions, moments) {
  return [
    ...entries.map((entry) => ({
      ...entry,
      key: `entry-${entry.id}`,
      kind: "entry",
      sortTime: `${entry.entry_date}T23:59:59`,
    })),
    ...versions.map((version) => ({
      ...version,
      key: `version-${version.id}`,
      kind: "version",
      sortTime: version.created_at,
    })),
    ...moments.map((moment) => ({
      ...moment,
      key: `moment-${moment.id}`,
      kind: "moment",
      sortTime: moment.created_at,
    })),
  ].sort((left, right) => new Date(right.sortTime) - new Date(left.sortTime));
}

export async function loadTimeline(client, userId) {
  const [entriesResult, versionsResult, momentsResult] = await Promise.all([
    client
      .from("daily_notes")
      .select("id, entry_date, content, updated_at")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(180),
    client
      .from("daily_note_versions")
      .select("id, entry_date, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(160),
    client
      .from("moment_traces")
      .select("id, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(160),
  ]);

  const error = entriesResult.error ?? versionsResult.error ?? momentsResult.error;
  if (error) return { data: null, error };

  return {
    data: mergeTimeline(
      entriesResult.data ?? [],
      versionsResult.data ?? [],
      momentsResult.data ?? [],
    ),
    error: null,
  };
}
