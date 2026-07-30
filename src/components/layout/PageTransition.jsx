import { motion, useReducedMotion } from "framer-motion";

function PageTransition({ pageKey, children }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      key={pageKey}
      className={`page-content page-content--${pageKey}`}
      initial={shouldReduceMotion ? false : { opacity: 0.9 }}
      animate={{ opacity: 1 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.12, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
