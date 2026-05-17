import { AnimatePresence, motion } from "framer-motion";
import { motionTransition } from "../../utils/motion";

function PageTransition({ pageKey, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        className="page-content"
        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
        transition={motionTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
