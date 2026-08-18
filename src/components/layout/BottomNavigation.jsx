import { NAV_ITEMS } from "../../constants/navigation";
import { NavIcon } from "../../ui/Icons";

function BottomNavigation({ page, onPageChange }) {
  const destination = NAV_ITEMS.find((item) => item.id !== page) ?? NAV_ITEMS[0];

  return (
    <nav
      className={`bottom-nav bottom-nav--${page}`}
      aria-label="Workspace navigation"
    >
      <div className="bottom-nav__container">
        <button
          type="button"
          className="bottom-nav__item"
          onClick={() => onPageChange(destination.id)}
          aria-label={destination.label}
        >
          <span className="bottom-nav__icon">
            <NavIcon name={destination.icon} />
          </span>
          <span className="bottom-nav__label" aria-hidden="true">
            {destination.label}
          </span>
        </button>
      </div>
    </nav>
  );
}

export default BottomNavigation;
