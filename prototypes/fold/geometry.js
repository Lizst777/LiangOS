export const DURATION_SECONDS = 10;

export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep(value) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

// Choreography is shared by scrubbing, live preview and video export.
export function sceneAt(progress, amplitude = 0.65) {
  const t = clamp(progress);
  const ramp = (start, end) => smoothstep((t - start) / (end - start));
  const left = (Math.PI - 0.06) * (1 - ramp(0.12, 0.32) + ramp(0.86, 0.94));
  const right = (Math.PI - 0.11) * (1 - ramp(0.06, 0.2) + ramp(0.91, 0.985));
  const flip = Math.PI * (ramp(0.6, 0.76) + ramp(0.94, 1));
  const movement = Math.sin(t * Math.PI * 2) * clamp(amplitude);
  return {
    left,
    right,
    flip,
    tilt: movement * 0.035 * (1 - ramp(0.32, 0.36) + ramp(0.58, 0.6)),
    phase:
      t < 0.06
        ? "收拢"
        : t < 0.32
          ? "展开"
          : t < 0.6
            ? "正面"
            : t < 0.76
              ? "翻面"
              : t < 0.86
                ? "背面"
                : "合拢",
  };
}

export function dimensions(ratio, width = 1080) {
  const ratios = { "3:4": 4 / 3, "1:1": 1, "9:16": 16 / 9 };
  return { width, height: Math.round(width * (ratios[ratio] ?? ratios["3:4"])) };
}

export function projectPoint(x, y, panel, width, height, pose) {
  const leaf = width / 3;
  const angle = panel === 0 ? pose.left : panel === 2 ? pose.right : 0;
  const distance = panel === 0 ? leaf - x : panel === 2 ? x - 2 * leaf : 0;
  const localX =
    panel === 0
      ? -leaf / 2 - distance * Math.cos(angle)
      : panel === 2
        ? leaf / 2 + distance * Math.cos(angle)
        : x - width / 2;
  const localZ = distance * Math.sin(angle);
  const rotatedX = localX * Math.cos(pose.flip) + localZ * Math.sin(pose.flip);
  const rotatedZ = -localX * Math.sin(pose.flip) + localZ * Math.cos(pose.flip);
  const localY = y - height / 2;
  const rotatedY = localY * Math.cos(pose.tilt) - rotatedZ * Math.sin(pose.tilt);
  const depth = localY * Math.sin(pose.tilt) + rotatedZ * Math.cos(pose.tilt);
  const perspective = (height * 2.6) / (height * 2.6 - depth);
  return { x: rotatedX * perspective, y: rotatedY * perspective, depth };
}

export function faceNormal(panel, pose) {
  const angle = panel === 0 ? pose.left : panel === 2 ? -pose.right : 0;
  return Math.cos(angle + pose.flip) * Math.cos(pose.tilt);
}

export function cropRect(
  imageWidth,
  imageHeight,
  targetWidth,
  targetHeight,
  zoom,
  cropX,
  cropY,
) {
  const scale = Math.max(targetWidth / imageWidth, targetHeight / imageHeight) * zoom;
  const sw = targetWidth / scale;
  const sh = targetHeight / scale;
  return {
    sx: ((imageWidth - sw) * (clamp(cropX, -1, 1) + 1)) / 2,
    sy: ((imageHeight - sh) * (clamp(cropY, -1, 1) + 1)) / 2,
    sw,
    sh,
  };
}
