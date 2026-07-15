import { motion } from "framer-motion";
import { NAV_ITEMS } from "../../constants/navigation";
import { NavIcon } from "../../ui/Icons";
import { motionTransition } from "../../utils/motion";

function BottomNavigation({ page, onPageChange }) {
  const destination = NAV_ITEMS.find((item) => item.id !== page) ?? NAV_ITEMS[0];

  return (
    <motion.nav
      className="bottom-nav"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTransition}
      aria-label="Workspace navigation"
    >
      <div className="bottom-nav__container">
        <button
          type="button"
          className="bottom-nav__item"
          onClick={() => onPageChange(destination.id)}
          aria-label={destination.label}
          title={destination.label}
        >
          <span className="bottom-nav__icon">
            <NavIcon name={destination.icon} />
          </span>
        </button>
      </div>
    </motion.nav>
  );
}

export default BottomNavigation;
