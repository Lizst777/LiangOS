import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { IconClose } from "../../ui/Icons";

export default function PrivateDialog({
  children,
  className,
  closeLabel,
  closeDisabled = false,
  isOpen,
  onClose,
  title,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  useDialogFocus(isOpen, dialogRef);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event) {
      if (event.key === "Escape" && !closeDisabled) onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeDisabled, isOpen, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.section
          className={className}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
        >
          <motion.div
            className={`${className}__inner`}
            ref={dialogRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
            transition={{ duration: reducedMotion ? 0 : 0.24 }}
          >
            <header className={`${className}__header`}>
              <h2 id={titleId}>{title}</h2>
              <button
                className={`${className}__close`}
                type="button"
                onClick={onClose}
                disabled={closeDisabled}
                aria-label={closeLabel}
                title={closeLabel}
                data-dialog-initial-focus
              >
                <IconClose />
              </button>
            </header>
            {children}
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>,
    document.querySelector(".liangos-app") ?? document.body,
  );
}
