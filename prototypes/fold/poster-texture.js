import { cropRect, dimensions } from "./geometry.js";
import { layoutCaption } from "./text-layout.js";

function fitText(ctx, text, maxWidth, size, family) {
  ctx.font = `${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 14) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
}

function drawCenteredText(ctx, text, y, width, size, family) {
  fitText(ctx, text, width * 0.86, size, family);
  ctx.fillText(text, width / 2, y);
}

function captionLayout(ctx, text, width) {
  const family = '"Songti SC", SimSun, serif';
  return layoutCaption(ctx, text, {
    width: width * 0.86,
    size: width * 0.032,
    family,
  });
}

function drawCaption(ctx, text, y, width) {
  const { lines, size } = captionLayout(ctx, text, width);
  const lineHeight = size * 1.25;
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, y + (index - (lines.length - 1) / 2) * lineHeight);
  });
}

function makeFront(state) {
  const canvas = document.createElement("canvas");
  const { width, height } = dimensions(state.ratio);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = state.paper;
  ctx.fillRect(0, 0, width, height);

  // Seeded grain stays fixed between frames and exports (no random shimmer).
  let seed = 23;
  for (let i = 0; i < 16000; i += 1) {
    seed = (seed * 16807) % 2147483647;
    const x = ((seed % 10000) / 10000) * width;
    seed = (seed * 16807) % 2147483647;
    const y = ((seed % 10000) / 10000) * height;
    ctx.fillStyle = i % 2 ? "#fff4" : "#382a1910";
    ctx.fillRect(x, y, 1.2, 1.2);
  }

  const photo = {
    x: width * 0.058,
    y: height * 0.28,
    width: width * 0.884,
    height: height * 0.64,
  };
  if (state.image) {
    const source = cropRect(
      state.image.width,
      state.image.height,
      photo.width,
      photo.height,
      state.zoom,
      state.cropX,
      state.cropY,
    );
    ctx.drawImage(
      state.image,
      source.sx,
      source.sy,
      source.sw,
      source.sh,
      photo.x,
      photo.y,
      photo.width,
      photo.height,
    );
  }
  ctx.fillStyle = "#232321";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const caption = captionLayout(ctx, state.subtitle, width);
  drawCenteredText(
    ctx,
    state.title,
    height * 0.135,
    width,
    Math.min(width * 0.27, height * (caption.lines.length > 1 ? 0.16 : 0.2)),
    'Georgia, "Times New Roman", "Songti SC", serif',
  );
  drawCaption(ctx, state.subtitle, height * 0.237, width);
  drawCenteredText(
    ctx,
    state.credit,
    height * 0.958,
    width,
    width * 0.021,
    'Georgia, "Songti SC", serif',
  );
  return canvas;
}

export function makeTexture(state) {
  const front = makeFront(state);
  const back = document.createElement("canvas");
  const { width, height } = front;
  back.width = width;
  back.height = height;
  const ctx = back.getContext("2d");
  ctx.fillStyle = state.paper;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#232321";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  drawCenteredText(
    ctx,
    "FOLD STUDY / 01",
    height * 0.15,
    width,
    width * 0.023,
    "Georgia, serif",
  );
  drawCenteredText(
    ctx,
    state.title,
    height * 0.43,
    width,
    width * 0.24,
    'Georgia, "Songti SC", serif',
  );
  drawCaption(ctx, state.subtitle, height * 0.57, width);
  ctx.strokeStyle = "#23232155";
  ctx.beginPath();
  ctx.moveTo(width * 0.46, height * 0.7);
  ctx.lineTo(width * 0.54, height * 0.7);
  ctx.stroke();
  drawCenteredText(
    ctx,
    state.credit,
    height * 0.78,
    width,
    width * 0.025,
    'Georgia, "Songti SC", serif',
  );
  return { front, back, width, height };
}
