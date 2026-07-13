/**
 * Core enums shared across the entire application.
 * Kept as string literal unions (not TS `enum`) so they serialize
 * cleanly to/from Firestore without extra mapping code.
 */

/** The four paper categories supported in V1. */
export type ExamType = 'CIE1' | 'CIE2' | 'CIE3' | 'SEE';

export const EXAM_TYPES: ExamType[] = ['CIE1', 'CIE2', 'CIE3', 'SEE'];

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  CIE1: 'CIE 1',
  CIE2: 'CIE 2',
  CIE3: 'CIE 3',
  SEE: 'SEE',
};

/** Lifecycle status of an uploaded paper, driven by the moderation workflow. */
export type PaperStatus = 'pending' | 'approved' | 'rejected';

/** Application-level role. Distinct from Firebase Auth's identity concept. */
export type UserRole = 'student' | 'admin';

/** Semesters offered in the CSBS curriculum (V1 covers 1–6). */
export type SemesterNumber = 1 | 2 | 3 | 4 | 5 | 6;

export const SEMESTERS: SemesterNumber[] = [1, 2, 3, 4, 5, 6];

/**
 * Academic year as a string in "YYYY-YY" form, e.g. "2024-25".
 * Kept as a plain string (validated by `isValidAcademicYear`) rather than a
 * union type, since new years are added by admins at runtime.
 */
export type AcademicYear = string;
