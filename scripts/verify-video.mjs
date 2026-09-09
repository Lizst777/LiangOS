import assert from "node:assert/strict";
import { Input, ALL_FORMATS, FilePathSource, EncodedPacketSink } from "mediabunny";
import { FRAME_COUNT, FRAME_RATE } from "../src/frame-sequence.js";

const path = process.argv[2];
if (!path) throw new Error("Usage: npm run verify:video -- <video-path>");
const input = new Input({ formats: ALL_FORMATS, source: new FilePathSource(path) });
try {
  const track = await input.getPrimaryVideoTrack();
  assert.ok(track, "Missing video track");
  const packets = [];
  for await (const packet of new EncodedPacketSink(track).packets()) {
    packets.push({ timestamp: packet.timestamp, duration: packet.duration });
  }
  packets.sort((a, b) => a.timestamp - b.timestamp);
  assert.equal(packets.length, FRAME_COUNT, "Incomplete frame count");
  for (const [index, packet] of packets.entries()) {
    assert.ok(
      Math.abs(packet.timestamp - index / FRAME_RATE) < 0.0001,
      `Frame ${index} timestamp mismatch`,
    );
    assert.ok(
      Math.abs(packet.duration - 1 / FRAME_RATE) < 0.0001,
      `Frame ${index} duration mismatch`,
    );
  }
  const duration = await track.computeDuration();
  assert.ok(Math.abs(duration - 10) < 0.0001);
  console.log(
    JSON.stringify(
      {
        codec: await track.getCodec(),
        width: await track.getCodedWidth(),
        height: await track.getCodedHeight(),
        frameCount: packets.length,
        frameRate: FRAME_RATE,
        duration,
        timestamps: "continuous",
      },
      null,
      2,
    ),
  );
} finally {
  input.dispose();
}
