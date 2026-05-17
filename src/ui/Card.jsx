import { motion } from "framer-motion";
import { motionTransition } from "../utils/motion";

const cardTransition = motionTransition;

function Card({ title, subtitle, children, className = "", headerRight }) {
  return (
    <motion.section
      className={`ui-surface ui-card ${className}`.trim()}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -1 }}
      transition={cardTransition}
    >
      {(title || subtitle || headerRight) && (
        <header className="ui-card__header">
          <div>
            {title && <h2 className="ui-card__title">{title}</h2>}
            {subtitle && <p className="ui-card__subtitle">{subtitle}</p>}
          </div>
          {headerRight}
        </header>
      )}
      <div className="ui-card__body">{children}</div>
    </motion.section>
  );
}

export default Card;
