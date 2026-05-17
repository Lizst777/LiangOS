import { getPageMeta } from "../../constants/navigation";

function PageHeader({ page, username }) {
  const meta = getPageMeta(page);

  return (
    <header className="page-header">
      <span className="ui-tag">Personal Digital System</span>
      <h1>{meta.title}</h1>
      <p className="page-header__desc">{meta.description}</p>
      <p className="page-header__meta">欢迎回来，{username}</p>
    </header>
  );
}

export default PageHeader;
