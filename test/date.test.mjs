import test from "node:test";
import assert from "node:assert/strict";
import { getLocalDateKey } from "../src/utils/date.js";

test("database ISO timestamps use the same local date as Date objects", () => {
  for (const date of [
    new Date(2026, 0, 2, 0, 5),
    new Date(2026, 0, 2, 23, 59),
    new Date(2028, 1, 29, 12),
  ]) {
    assert.equal(getLocalDateKey(date.toISOString()), getLocalDateKey(date));
  }
});

test("date keys pad month and day without changing the input", () => {
  const date = new Date(2026, 0, 2, 0, 5);
  const timestamp = date.getTime();
  assert.equal(getLocalDateKey(date), "2026-01-02");
  assert.equal(date.getTime(), timestamp);
});

test("invalid dates fail explicitly instead of generating a corrupt key", () => {
  assert.throws(() => getLocalDateKey("not a date"), RangeError);
  assert.throws(() => getLocalDateKey(new Date(NaN)), RangeError);
});
