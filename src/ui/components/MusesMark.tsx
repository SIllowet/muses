import { motion, useReducedMotion } from "motion/react";

/**
 * The Muses lyre. Drawn in `currentColor` so it follows whatever text colour it sits in
 * (the accent when Home is active, muted otherwise) and every palette without a variant.
 *
 * `draw` strokes the lyre in on mount: frame first, then the strings one by one, like
 * it is being strung. Used on the loading screen only; the title bar mark is static.
 */
interface MusesMarkProps {
  className?: string;
  draw?: boolean;
}

const FRAME = "M 316 232 C 232 344, 176 484, 316 596 A 196 196 0 0 0 708 596 C 848 484, 792 344, 708 232";
const CROSSBAR = "M 232 316 L 792 316";
const STRINGS = ["M 414 316 L 414 766", "M 512 316 L 512 792", "M 610 316 L 610 766"];

export function MusesMark({ className, draw = false }: MusesMarkProps) {
  const reduceMotion = useReducedMotion();
  const animate = draw && !reduceMotion;

  const stroke = (delay: number) =>
    animate
      ? {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { pathLength: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }, opacity: { duration: 0.1, delay } },
        }
      : {};

  return (
    <svg
      className={className}
      viewBox="190 190 644 644"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <motion.path d={FRAME} strokeWidth={48} {...stroke(0)} />
      <motion.path d={CROSSBAR} strokeWidth={48} {...stroke(0.35)} />
      {STRINGS.map((d, i) => (
        <motion.path key={d} d={d} strokeWidth={24} {...stroke(0.55 + i * 0.12)} />
      ))}
    </svg>
  );
}
