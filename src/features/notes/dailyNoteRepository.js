export function loadDailyNote(client, { entryDate, userId }) {
  return client
    .from("daily_notes")
    .select("content, entry_date")
    .eq("user_id", userId)
    .eq("entry_date", entryDate)
    .maybeSingle();
}

export function saveDailyNote(client, { content, entryDate, userId }) {
  return client.from("daily_notes").upsert(
    {
      user_id: userId,
      entry_date: entryDate,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,entry_date" },
  );
}
