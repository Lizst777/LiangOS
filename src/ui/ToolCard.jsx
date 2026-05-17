import { motion } from "framer-motion";
import { CATEGORY_LABELS } from "../data/tools";
import { isFavorite } from "../utils/toolsFavorites";
import {
  motionHoverTransition,
  motionTapTransition,
  motionTransition,
} from "../utils/motion";

function StarIcon({ filled }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

function ToolCard({
  tool,
  favoriteIds,
  onToggleFavorite,
  onVisit,
  compact = false,
  index = 0,
}) {
  const favorited = isFavorite(tool.id, favoriteIds);

  return (
    <motion.article
      layout
      className={compact ? "tool-card tool-card--compact" : "tool-card"}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      whileHover={{ scale: 1.01, y: -1 }}
      transition={{
        ...motionTransition,
        delay: Math.min(index * 0.02, 0.1),
      }}
    >
      <div className="tool-card__top">
        <div className="tool-card__identity">
          <span className="tool-card__icon" aria-hidden>
            {tool.icon}
          </span>
          <div>
            <h3 className="tool-card__name">{tool.name}</h3>
            <span className="tool-card__category">
              {CATEGORY_LABELS[tool.category]}
            </span>
          </div>
        </div>
        <motion.button
          type="button"
          className={
            favorited ? "tool-card__fav tool-card__fav--on" : "tool-card__fav"
          }
          onClick={() => onToggleFavorite(tool.id)}
          aria-label={favorited ? `取消收藏 ${tool.name}` : `收藏 ${tool.name}`}
          title={favorited ? "取消收藏" : "收藏"}
          whileTap={{ scale: 0.96 }}
          transition={motionTapTransition}
        >
          <StarIcon filled={favorited} />
        </motion.button>
      </div>

      <p className="tool-card__desc">{tool.desc}</p>

      <div className="tool-card__tags">
        {tool.tags.map((tag) => (
          <span key={tag} className="tool-card__tag">
            {tag}
          </span>
        ))}
      </div>

      <footer className="tool-card__footer">
        <span className="tool-card__rating">
          {tool.rating.toFixed(1)}
          <span> / 5</span>
        </span>
        <a
          className="tool-card__link"
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onVisit(tool.id)}
        >
          访问
        </a>
      </footer>
    </motion.article>
  );
}

export default ToolCard;
