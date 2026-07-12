export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (from, to, amount) => from + (to - from) * amount;
export const inverseLerp = (from, to, value) => from === to ? 0 : clamp((value - from) / (to - from), 0, 1);
export const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
export const easeOutCubic = (t) => 1 - ((1 - t) ** 3);
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * ((t - 1) ** 3) + c1 * ((t - 1) ** 2);
};
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const pointInCircle = (point, circle) => distance(point, circle) <= circle.r;
export const pointInRect = (point, rect) => point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
