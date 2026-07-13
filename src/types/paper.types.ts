import type { AcademicYear, ExamType, PaperStatus, SemesterNumber } from './common.types';

/**
 * Mirrors a document in the `papers` Firestore collection.
 * This is the single source of truth for both "available" papers shown
 * publicly and "pending/rejected" submissions awaiting moderation —
 * visibility is controlled entirely by `status`, never by a separate
 * collection, so the moderation system generalizes to future content
 * types (notes, assignments, etc.) without a schema change.
 */
export interface Paper {
  /** Firestore document ID (auto-generated). */
  id: string;

  // --- Academic classification ---
  semester: SemesterNumber;
  /** Denormalized for fast reads/search; source of truth is `subjects/{subjectId}`. */
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  academicYear: AcademicYear;
  examType: ExamType;

  // --- File data ---
  /** Download URL in Firebase Storage. Null while the upload is still in flight. */
  pdfUrl: string | null;
  /** Path within the Storage bucket, used for delete/replace operations. */
  pdfStoragePath: string | null;
  previewImageUrl: string | null;
  previewImageStoragePath: string | null;
  /** File size in bytes, captured at upload time. */
  fileSize: number;

  // --- Contributor info ---
  uploadedBy: string; // UserProfile.uid
  uploadedByName: string;
  uploadedByEmail: string;

  // --- Moderation ---
  status: PaperStatus;
  /** Populated only when status === 'rejected'. */
  rejectionReason: string | null;
  reviewedBy: string | null; // admin UID
  reviewedAt: number | null;

  // --- Engagement ---
  downloadCount: number;

  // --- Timestamps (epoch millis) ---
  uploadDate: number;
  lastUpdated: number;
}

/** Fields a student supplies when starting an upload (Step 2+ of the upload flow). */
export interface PaperUploadInput {
  semester: SemesterNumber;
  subjectId: string;
  academicYear: AcademicYear;
  examType: ExamType;
  file: File;
}

/** A lightweight "slot" representing one paper that may or may not exist yet —
 *  used to render the "Missing Paper / Contribute" grid on subject pages. */
export interface PaperSlot {
  semester: SemesterNumber;
  subjectId: string;
  academicYear: AcademicYear;
  examType: ExamType;
  paper: Paper | null;
}
