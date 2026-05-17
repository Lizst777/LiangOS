import { AnimatePresence, motion } from "framer-motion";
import { motionPanelTransition } from "../../utils/motion";

function PageTransition({ pageKey, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        className="page-content"
        initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
        transition={motionPanelTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
