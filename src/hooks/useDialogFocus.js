import { useEffect } from "react";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useDialogFocus(isOpen, containerRef) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return undefined;

    const container = containerRef.current;
    const previousFocus = document.activeElement;
    const initialFocus =
      container.querySelector("[data-dialog-initial-focus]") ??
      container.querySelector(FOCUSABLE_SELECTOR) ??
      container;

    initialFocus.focus();

    function trapFocus(event) {
      if (event.key !== "Tab") return;

      const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", trapFocus);

    return () => {
      document.removeEventListener("keydown", trapFocus);
      if (previousFocus instanceof HTMLElement && document.contains(previousFocus)) {
        previousFocus.focus();
      }
    };
  }, [containerRef, isOpen]);
}
