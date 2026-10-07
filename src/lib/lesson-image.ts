// Safe to import from browser code (no Node modules here).

/** Widths (px) a lesson image can be requested at, so the folder of resized copies cannot grow without limit. */
export const LESSON_WIDTHS = [160, 480, 1200] as const;
export type LessonWidth = (typeof LESSON_WIDTHS)[number];

/** URL of a lesson page image, optionally resized to one of LESSON_WIDTHS. */
export const lessonImageUrl = (id: string, width?: LessonWidth) => `/files/lessons/${id}${width ? `?w=${width}` : ""}`;
