import { faceNormal, projectPoint, sceneAt } from "./geometry.js";
import { drawTriangle } from "./texture-mesh.js";

function polygon(ctx, points) {
  ctx.beginPath();
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.closePath();
}

function drawPanel(ctx, texture, panel, pose) {
  const { width, height } = texture;
  const leaf = width / 3;
  const normal = faceNormal(panel, pose);
  const project = (x, y) => projectPoint(x, y, panel, width, height, pose);
  const corners = [
    [panel * leaf, 0],
    [(panel + 1) * leaf, 0],
    [(panel + 1) * leaf, height],
    [panel * leaf, height],
  ];
  const points = corners.map(([x, y]) => project(x, y));
  // Perspective changes which side is visible before/after the nominal 90°.
  // Use projected winding to avoid switching textures on a still-visible face.
  const facing = points.reduce((area, point, i) => {
    const next = points[(i + 1) % points.length];
    return area + point.x * next.y - next.x * point.y;
  }, 0);
  if (Math.abs(facing) < 0.01) return;
  const back = facing < 0;
  const image = back ? texture.back : texture.front;
  ctx.save();
  polygon(ctx, points);
  ctx.fillStyle = "#d5cfc2";
  ctx.fill();
  ctx.clip();
  // Subdivision approximates perspective; each leaf is clipped once at its rim.
  for (let column = 0; column < 6; column += 1) {
    for (let row = 0; row < 2; row += 1) {
      const x0 = panel * leaf + (column * leaf) / 6;
      const x1 = x0 + leaf / 6;
      const y0 = (row * height) / 2;
      const y1 = y0 + height / 2;
      const uv = [
        [x0, y0],
        [x1, y0],
        [x0, y1],
        [x1, y1],
      ];
      const targets = uv.map(([x, y]) => {
        const p = project(x, y);
        return [p.x, p.y];
      });
      const sources = uv.map(([x, y]) => [back ? width - x : x, y]);
      for (const indices of [
        [0, 1, 2],
        [3, 2, 1],
      ]) {
        drawTriangle(
          ctx,
          image,
          indices.map((i) => sources[i]),
          indices.map((i) => targets[i]),
        );
      }
    }
  }
  const shade = (1 - Math.abs(normal)) * 0.22;
  ctx.fillStyle = `rgba(35, 30, 23, ${shade})`;
  polygon(ctx, points);
  ctx.fill();
  ctx.restore();
  polygon(ctx, points);
  ctx.strokeStyle = "#6b62551c";
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

export function drawFrame(canvas, texture, progress, amplitude, overridePose) {
  const ctx = canvas.getContext("2d");
  const pose = overridePose ?? sceneAt(progress, amplitude);
  const scale = Math.min(
    (canvas.width * 0.8) / texture.width,
    (canvas.height * 0.85) / texture.height,
  );
  ctx.fillStyle = "#eeede8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(scale, scale);
  // Shadows are drawn behind the whole object, never over adjacent flat leaves.
  ctx.shadowColor = "#302c232e";
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#d5cfc2";
  for (const panel of [0, 1, 2]) {
    const x0 = (panel * texture.width) / 3;
    const x1 = ((panel + 1) * texture.width) / 3;
    polygon(
      ctx,
      [
        [x0, 0],
        [x1, 0],
        [x1, texture.height],
        [x0, texture.height],
      ].map(([x, y]) => projectPoint(x, y, panel, texture.width, texture.height, pose)),
    );
    ctx.fill();
  }
  ctx.shadowColor = "transparent";
  if (
    pose.left === 0 &&
    pose.right === 0 &&
    Math.abs(Math.sin(pose.flip)) < 0.00001 &&
    Math.abs(pose.tilt) < 0.00001
  ) {
    ctx.drawImage(
      Math.cos(pose.flip) > 0 ? texture.front : texture.back,
      -texture.width / 2,
      -texture.height / 2,
    );
    ctx.restore();
    return;
  }
  const panels = [0, 1, 2].map((panel) => ({
    panel,
    depth: projectPoint(
      ((panel + 0.5) * texture.width) / 3,
      texture.height / 2,
      panel,
      texture.width,
      texture.height,
      pose,
    ).depth,
  }));
  panels.sort((a, b) => a.depth - b.depth);
  for (const { panel } of panels) drawPanel(ctx, texture, panel, pose);
  ctx.restore();
}
