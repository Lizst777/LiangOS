const TRACE_FIELDS = [
  "id",
  "content",
  "weather_text",
  "temperature",
  "location",
  "created_at",
  "quote_date",
  "quote_author",
  "quote_source",
  "quote_source_url",
].join(", ");

const LEGACY_TRACE_FIELDS = [
  "id",
  "content",
  "weather_text",
  "temperature",
  "location",
  "created_at",
].join(", ");

export function isMissingQuoteMetadata(error) {
  if (!error) return false;

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /quote_(date|author|source)/i.test(error.message ?? "")
  );
}

export async function findSavedQuote(client, { content, quoteDate, userId }) {
  let result = await client
    .from("moment_traces")
    .select("quote_date")
    .eq("user_id", userId)
    .eq("quote_date", quoteDate)
    .limit(1)
    .maybeSingle();

  if (isMissingQuoteMetadata(result.error)) {
    result = await client
      .from("moment_traces")
      .select("content")
      .eq("user_id", userId)
      .eq("content", content)
      .limit(1)
      .maybeSingle();
  }

  return result;
}

export async function saveMomentTrace(client, trace) {
  let result = await client
    .from("moment_traces")
    .upsert(trace, { onConflict: "user_id,quote_date" });

  if (isMissingQuoteMetadata(result.error)) {
    const legacyTrace = {
      content: trace.content,
      daypart: trace.daypart,
      location: trace.location,
      temperature: trace.temperature,
      user_id: trace.user_id,
      weather_text: trace.weather_text,
    };
    result = await client.from("moment_traces").insert(legacyTrace);
  }

  return result;
}

export async function loadMomentTraces(client, userId, limit = 120) {
  let result = await client
    .from("moment_traces")
    .select(TRACE_FIELDS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (isMissingQuoteMetadata(result.error)) {
    result = await client
      .from("moment_traces")
      .select(LEGACY_TRACE_FIELDS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
  }

  return result;
}

export function updateMomentTrace(client, { content, id, userId }) {
  return client
    .from("moment_traces")
    .update({ content })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, content")
    .single();
}

export function deleteMomentTrace(client, { id, userId }) {
  return client
    .from("moment_traces")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .single();
}
