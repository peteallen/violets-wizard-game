export const chapter1PresentationRegistrations = Object.freeze([]);

export const chapter1PresentationPackage = Object.freeze({
  chapterId: 'ch1',
  registrations: chapter1PresentationRegistrations,
  roomMusic: Object.freeze({
    default: 'music/ch1/violetTheme',
    rooms: Object.freeze({
      'ch1.diagonStreet': 'music/ch1/diagonAlley',
    }),
  }),
});

export default chapter1PresentationPackage;
