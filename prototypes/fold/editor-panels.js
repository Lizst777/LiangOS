// Keep this breakpoint aligned with mobile-studio.css.
export const COMPACT_EDITOR =
  "(max-width: 760px), (max-width: 1000px) and (max-height: 500px)";

/** Only presentation state lives here; switching tabs never modifies the document. */
export function createEditorPanels({ tabs, panels, scroller, help, media, onSwitch }) {
  const buttons = [...tabs.querySelectorAll("[role=tab]")];
  let active = "text";

  function select(name, focus = false) {
    active = name;
    for (const button of buttons) {
      const selected = button.dataset.pane === active;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    }
    for (const panel of panels) {
      panel.hidden = media.matches && panel.dataset.pane !== active;
    }
    scroller.scrollTop = 0;
    onSwitch();
  }

  function layout() {
    tabs.hidden = !media.matches;
    help.open = !media.matches;
    for (const panel of panels) {
      if (media.matches) {
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", `tab-${panel.dataset.pane}`);
      } else {
        panel.removeAttribute("role");
        panel.removeAttribute("aria-labelledby");
      }
    }
    const focused = tabs.ownerDocument.activeElement;
    if (media.matches) {
      const focusedPanel = panels.find((panel) => panel.contains(focused));
      if (focusedPanel) active = focusedPanel.dataset.pane;
    }
    select(active);
    // Resizing to desktop must not leave keyboard focus inside a hidden tab strip.
    if (!media.matches && buttons.includes(focused)) {
      panels
        .find((panel) => panel.dataset.pane === active)
        ?.querySelector("input, button")
        ?.focus();
    }
  }

  for (const button of buttons) {
    button.addEventListener("click", () => select(button.dataset.pane));
    button.addEventListener("keydown", (event) => {
      const index = buttons.indexOf(button);
      const destinations = {
        ArrowRight: (index + 1) % buttons.length,
        ArrowLeft: (index + buttons.length - 1) % buttons.length,
        Home: 0,
        End: buttons.length - 1,
      };
      if (!(event.key in destinations)) return;
      event.preventDefault();
      select(buttons[destinations[event.key]].dataset.pane, true);
    });
  }
  media.addEventListener("change", layout);
  layout();
}

/** Use the visible height when a software keyboard reduces the editing area. */
export function trackEditorViewport(root, viewport = window.visualViewport) {
  if (!viewport) return;
  function update() {
    if (Math.abs(viewport.scale - 1) > 0.01) {
      root.style.removeProperty("--editor-viewport-height");
      return;
    }
    root.style.setProperty(
      "--editor-viewport-height",
      `${Math.round(viewport.height)}px`,
    );
  }
  viewport.addEventListener("resize", update);
  update();
}
