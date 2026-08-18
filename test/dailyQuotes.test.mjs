import test from "node:test";
import assert from "node:assert/strict";
import {
  DAILY_QUOTES,
  getDailyQuote,
  getLocalDateKey,
  getMillisecondsUntilTomorrow,
} from "../src/data/dailyQuotes.js";

test("the local quote corpus covers a leap year without duplicate text", () => {
  assert.equal(DAILY_QUOTES.length, 366);
  assert.equal(new Set(DAILY_QUOTES.map(({ content }) => content)).size, 366);

  for (const quote of DAILY_QUOTES) {
    assert.ok(quote.id);
    assert.ok(quote.content.length >= 6);
    assert.ok(quote.content.length <= 120);
    assert.ok(quote.author);
    assert.ok(quote.source);
    assert.match(quote.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("a quote is stable for the entire local calendar day", () => {
  const morning = new Date(2026, 7, 18, 0, 0, 1);
  const evening = new Date(2026, 7, 18, 23, 59, 59);

  assert.deepEqual(getDailyQuote(morning), getDailyQuote(evening));
  assert.equal(getDailyQuote(morning).dateKey, "2026-08-18");
});

test("the quote advances once when the local date changes", () => {
  const first = getDailyQuote(new Date(2026, 7, 18, 23, 59, 59));
  const next = getDailyQuote(new Date(2026, 7, 19, 0, 0, 1));

  assert.notEqual(first.id, next.id);
  assert.equal(next.dateKey, "2026-08-19");
});

test("local date keys are not affected by UTC day boundaries", () => {
  assert.equal(getLocalDateKey(new Date(2026, 0, 2, 0, 5)), "2026-01-02");
});

test("the midnight timer never schedules a zero or negative delay", () => {
  const delay = getMillisecondsUntilTomorrow(new Date(2026, 7, 18, 23, 59, 59, 999));
  assert.ok(delay >= 1000);
  assert.ok(delay <= 1100);
});
