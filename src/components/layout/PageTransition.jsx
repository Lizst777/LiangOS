function PageTransition({ pageKey, isActive, children }) {
  return (
    <div
      className={`page-content page-content--${pageKey} ${
        isActive ? "page-content--active" : "page-content--inactive"
      }`}
      aria-hidden={!isActive}
      inert={!isActive}
    >
      {children}
    </div>
  );
}

export default PageTransition;
