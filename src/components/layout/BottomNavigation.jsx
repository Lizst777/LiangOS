import { motion } from "framer-motion";
import { NAV_ITEMS } from "../../constants/navigation";
import { NavIcon } from "../../ui/Icons";
import { motionTransition } from "../../utils/motion";

function BottomNavigation({ page, onPageChange }) {
  return (
    <motion.nav
      className="bottom-nav"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTransition}
    >
      <div className="bottom-nav__container">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              page === item.id
                ? "bottom-nav__item bottom-nav__item--active"
                : "bottom-nav__item"
            }
            onClick={() => onPageChange(item.id)}
            aria-current={page === item.id ? "page" : undefined}
            title={item.label}
          >
            <span className="bottom-nav__icon">
              <NavIcon name={item.icon} />
            </span>
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        ))}
      </div>
    </motion.nav>
  );
}

export default BottomNavigation;
