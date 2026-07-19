export const BOOT_STAGE_COPY = Object.freeze({
  runtime: Object.freeze({
    title: 'Opening Violet’s storybook…',
    status: 'Gathering Violet’s story.',
  }),
  fonts: Object.freeze({
    title: 'Opening Violet’s storybook…',
    status: 'Preparing the storybook lettering.',
  }),
  presentation: Object.freeze({
    title: 'Opening Violet’s storybook…',
    status: 'Painting Hogwarts around Violet.',
  }),
  title: Object.freeze({
    title: 'Opening Violet’s storybook…',
    status: 'Calling Violet and her owl to the window.',
  }),
  bootstrap: Object.freeze({
    title: 'Opening Violet’s storybook…',
    status: 'Opening the storybook to Violet’s page.',
  }),
});

export const BOOT_FAILURE_TITLE = 'The storybook paused.';

export const BOOT_FAILURE_COPY = Object.freeze({
  runtime: 'Violet’s story could not be gathered. Try opening it again.',
  fonts: 'The storybook lettering did not arrive. Try opening it again.',
  presentation: 'The castle paintings did not arrive. Try opening them again.',
  title: 'Violet and her owl could not reach the window. Try calling them again.',
  bootstrap: 'Violet’s adventure could not open. Try opening it again.',
});
