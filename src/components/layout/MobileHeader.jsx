import { getPageMeta } from "../../constants/navigation";

function MobileHeader({ page }) {
  const meta = getPageMeta(page);

  return (
    <header className="mobile-header">
      <div>
        <span className="mobile-header__brand">LiangOS</span>
        <h1 className="mobile-header__title">{meta.title}</h1>
      </div>
      <span className="mobile-header__status">Online</span>
    </header>
  );
}

export default MobileHeader;
