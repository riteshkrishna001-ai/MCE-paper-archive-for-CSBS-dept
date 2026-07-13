import type { AcademicYear, SemesterNumber } from './common.types';

/**
 * Mirrors a document in the `subjects` Firestore collection.
 * Subjects are added by admins and referenced by ID from `papers`,
 * avoiding duplicated subject metadata across paper documents.
 */
export interface Subject {
  /** Firestore document ID, e.g. "cs404". */
  id: string;
  /** Official VTU subject name, e.g. "Design and Analysis of Algorithms". */
  name: string;
  /** Official VTU subject code, e.g. "CS404". */
  code: string;
  semester: SemesterNumber;
  /** Soft-delete / hide flag so admins can retire a subject without losing history. */
  isActive: boolean;
  createdAt: number;
}

/**
 * Mirrors a document in the `academicYears` Firestore collection.
 * Stored centrally (rather than as a free-text field on every paper) so
 * the set of valid years is admin-controlled and consistent everywhere.
 */
export interface AcademicYearRecord {
  /** Same as `year`, used as the Firestore document ID for easy lookups. */
  id: AcademicYear;
  /** e.g. "2024-25" */
  year: AcademicYear;
  isActive: boolean;
  createdAt: number;
}

/** Validates the "YYYY-YY" academic year format, e.g. "2024-25". */
export function isValidAcademicYear(value: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return false;
  const startYear = Number(match[1]);
  const endYearSuffix = Number(match[2]);
  const expectedSuffix = (startYear + 1) % 100;
  return endYearSuffix === expectedSuffix;
}
