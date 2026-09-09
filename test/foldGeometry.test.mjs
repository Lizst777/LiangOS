import assert from "node:assert/strict";
import test from "node:test";
import {
  cropRect,
  dimensions,
  sceneAt,
  projectPoint,
  faceNormal,
} from "../src/geometry.js";

test("loop endpoints have identical projected geometry", () => {
  for (const panel of [0, 1, 2]) {
    for (const x of [panel * 360, (panel + 1) * 360]) {
      const a = projectPoint(x, 0, panel, 1080, 1440, sceneAt(0));
      const b = projectPoint(x, 0, panel, 1080, 1440, sceneAt(1));
      assert.ok(Math.abs(a.x - b.x) < 0.00001);
      assert.ok(Math.abs(a.y - b.y) < 0.00001);
    }
  }
});
test("front and reverse have readable unfolded holds", () => {
  for (const t of [0.36, 0.45, 0.58, 0.78, 0.81, 0.85]) {
    const pose = sceneAt(t);
    assert.equal(pose.left, 0);
    assert.equal(pose.right, 0);
    assert.ok(Math.abs(faceNormal(1, pose)) > 0.99);
  }
  assert.ok(faceNormal(1, sceneAt(0.45)) > 0);
  assert.ok(faceNormal(1, sceneAt(0.81)) < 0);
});
test("both hinges stay connected throughout the whole motion", () => {
  for (let i = 0; i <= 1000; i++) {
    const pose = sceneAt(i / 1000);
    for (const [x, a, b] of [
      [360, 0, 1],
      [720, 1, 2],
    ]) {
      for (const y of [0, 720, 1440]) {
        assert.deepEqual(
          projectPoint(x, y, a, 1080, 1440, pose),
          projectPoint(x, y, b, 1080, 1440, pose),
        );
      }
    }
  }
});
test("all projections stay finite and bounded at edge-on rotations", () => {
  for (let i = 0; i <= 1000; i++)
    for (const panel of [0, 1, 2]) {
      const p = projectPoint(panel * 360, 0, panel, 1080, 1440, sceneAt(i / 1000, 1));
      for (const value of Object.values(p))
        assert.ok(Number.isFinite(value) && Math.abs(value) < 3000);
    }
});
test("outer leaf opens before inner leaf and folding is not disabled by camera setting", () => {
  assert.ok(sceneAt(0.1).right < sceneAt(0).right);
  assert.equal(sceneAt(0.1).left, sceneAt(0).left);
  assert.equal(sceneAt(0, 0).left, sceneAt(0, 1).left);
});
test("ratios produce actual export dimensions", () => {
  assert.deepEqual(dimensions("9:16"), { width: 1080, height: 1920 });
  assert.deepEqual(dimensions("1:1"), { width: 1080, height: 1080 });
});
test("cropping never exceeds source image", () => {
  for (const zoom of [1, 2.5])
    for (const x of [-1, 0, 1]) {
      const r = cropRect(1200, 1600, 950, 920, zoom, x, -x);
      assert.ok(r.sx >= 0 && r.sy >= 0);
      assert.ok(r.sx + r.sw <= 1200.0001 && r.sy + r.sh <= 1600.0001);
    }
});
