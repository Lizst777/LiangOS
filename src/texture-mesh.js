// Affine triangles approximate the projective paper surface without scanline gaps.
export function drawTriangle(ctx, image, source, target) {
  const [s0, s1, s2] = source;
  const [p0, p1, p2] = target;
  const ux = s1[0] - s0[0],
    uy = s1[1] - s0[1];
  const vx = s2[0] - s0[0],
    vy = s2[1] - s0[1];
  const determinant = ux * vy - uy * vx;
  const area = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0]);
  if (Math.abs(determinant) < 0.00001 || Math.abs(area) < 0.01) return;
  const a = ((p1[0] - p0[0]) * vy - (p2[0] - p0[0]) * uy) / determinant;
  const b = ((p1[1] - p0[1]) * vy - (p2[1] - p0[1]) * uy) / determinant;
  const c = ((p2[0] - p0[0]) * ux - (p1[0] - p0[0]) * vx) / determinant;
  const d = ((p2[1] - p0[1]) * ux - (p1[1] - p0[1]) * vx) / determinant;
  const winding = Math.sign(
    (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0]),
  );
  const normals = target.map((point, i) => {
    const next = target[(i + 1) % 3];
    const dx = next[0] - point[0],
      dy = next[1] - point[1];
    const length = Math.hypot(dx, dy);
    return [(winding * dy) / length, (-winding * dx) / length];
  });
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 3; i += 1) {
    // Offset edges, not radial vertices: thin triangles need equal seam coverage.
    const previous = normals[(i + 2) % 3],
      next = normals[i];
    const miter =
      2 / Math.max(0.0001, 1 + previous[0] * next[0] + previous[1] * next[1]);
    ctx.lineTo(
      target[i][0] + (previous[0] + next[0]) * miter,
      target[i][1] + (previous[1] + next[1]) * miter,
    );
  }
  ctx.closePath();
  ctx.clip();
  ctx.transform(
    a,
    b,
    c,
    d,
    p0[0] - a * s0[0] - c * s0[1],
    p0[1] - b * s0[0] - d * s0[1],
  );
  // Only sample this triangle's source tile, not the entire high-resolution page.
  const minX = Math.max(0, Math.floor(Math.min(...source.map((p) => p[0]))) - 2);
  const minY = Math.max(0, Math.floor(Math.min(...source.map((p) => p[1]))) - 2);
  const maxX = Math.min(
    image.width,
    Math.ceil(Math.max(...source.map((p) => p[0]))) + 2,
  );
  const maxY = Math.min(
    image.height,
    Math.ceil(Math.max(...source.map((p) => p[1]))) + 2,
  );
  ctx.drawImage(
    image,
    minX,
    minY,
    maxX - minX,
    maxY - minY,
    minX,
    minY,
    maxX - minX,
    maxY - minY,
  );
  ctx.restore();
}
