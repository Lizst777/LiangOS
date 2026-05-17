function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  ...rest
}) {
  const variantClass = variant === "ghost" ? "ui-btn--ghost" : "";
  return (
    <button
      type={type}
      className={`ui-btn ${variantClass} ${className}`.trim()}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
