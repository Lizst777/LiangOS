export function detailSize(width, height, ratio, zoom) {
  const fitted = Math.max(1, Math.min(width, height * ratio));
  return { width: fitted * zoom, height: (fitted / ratio) * zoom };
}

/** A read-only snapshot; never changes cropping, history or stored documents. */
export function createDetailViewer(ui, { snapshot, pause }) {
  let texture = null;
  let side = "front";
  let zoom = 1;

  function resize() {
    if (!texture || !ui.dialog.open) return;
    const size = detailSize(
      ui.scroller.clientWidth,
      ui.scroller.clientHeight,
      texture.width / texture.height,
      zoom,
    );
    ui.canvas.style.width = `${size.width}px`;
    ui.canvas.style.height = `${size.height}px`;
  }

  function draw() {
    if (!texture) return;
    ui.canvas.width = texture.width;
    ui.canvas.height = texture.height;
    ui.canvas.getContext("2d").drawImage(texture[side], 0, 0);
    ui.canvas.setAttribute("aria-label", side === "front" ? "海报正面" : "海报背面");
    ui.front.setAttribute("aria-pressed", String(side === "front"));
    ui.back.setAttribute("aria-pressed", String(side === "back"));
    resize();
    ui.scroller.scrollTop = 0;
    ui.scroller.scrollLeft = 0;
  }

  const observer = new ResizeObserver(resize);
  ui.open.addEventListener("click", () => {
    texture = snapshot().texture;
    if (!texture) return;
    pause();
    side = "front";
    zoom = 1;
    ui.zoom.textContent = "放大 2 倍";
    ui.zoom.setAttribute("aria-pressed", "false");
    ui.dialog.showModal();
    observer.observe(ui.scroller);
    draw();
  });
  for (const name of ["front", "back"]) {
    ui[name].addEventListener("click", () => {
      side = name;
      draw();
    });
  }
  ui.zoom.addEventListener("click", () => {
    zoom = zoom === 1 ? 2 : 1;
    ui.zoom.textContent = zoom === 1 ? "放大 2 倍" : "适应画面";
    ui.zoom.setAttribute("aria-pressed", String(zoom === 2));
    resize();
    ui.scroller.scrollTop = 0;
    ui.scroller.scrollLeft = 0;
  });
  ui.close.addEventListener("click", () => ui.dialog.close());
  ui.dialog.addEventListener("close", () => {
    observer.disconnect();
    texture = null;
    ui.canvas.width = ui.canvas.height = 1;
    ui.open.focus({ preventScroll: true });
  });
}
