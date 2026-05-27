import gsap from "gsap";

export const gsapEase = "power2.out";

export const gsapDuration = {
  fast: 0.22,
  base: 0.35,
};

export const gsapMotion = {
  ease: gsapEase,
  duration: gsapDuration,
};

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function fadeInUp(targets, options = {}) {
  const {
    y = 8,
    duration = gsapDuration.base,
    stagger,
    delay,
    overwrite = "auto",
    ease = gsapEase,
  } = options;

  if (prefersReducedMotion()) {
    return gsap.set(targets, { autoAlpha: 1, y: 0 });
  }

  return gsap.from(targets, {
    autoAlpha: 0,
    y,
    duration,
    ease,
    stagger,
    delay,
    overwrite,
  });
}
