import { getPageMeta } from "../../constants/navigation";

function PageHeader({ page }) {
  const meta = getPageMeta(page);

  if (page === "dashboard") {
    return null;
  }

  return (
    <header className="page-header" aria-label="Current view">
      <span className="page-header__kicker">Current View</span>
      <div className="page-header__line">
        <h1>{meta.title}</h1>
      </div>
      <p className="page-header__desc">{meta.description}</p>
    </header>
  );
}

export default PageHeader;
