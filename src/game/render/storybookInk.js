// Shared authoring-space ink values for code-drawn storybook layers. Line
// weights are virtual 1280×720 canvas pixels; a puppet's own transform may
// scale them, but the detail/contour hierarchy stays consistent across layers.
export const STORYBOOK_INK = Object.freeze({
  primary: '#49372e',
  deep: '#342720',
  soft: 'rgba(73, 55, 46, 0.62)',
});

export const STORYBOOK_LINE_WEIGHT = Object.freeze({
  detail: 1.1,
  feature: 1.5,
  contour: 2.2,
  bold: 3,
  emphasis: 3.4,
});
