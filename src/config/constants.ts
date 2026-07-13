/** App-wide constants. Centralized so limits stay consistent between the
 *  client-side UI checks and the Storage Security Rules (Step: Security). */

export const APP_NAME = 'MCE CSBS Paper Vault';
export const COLLEGE_NAME = 'Malnad College of Engineering';
export const DEPARTMENT_NAME = 'Computer Science and Business Systems';
export const COLLEGE_LOCATION = 'Hassan';
export const TAGLINE = 'One Place for Every CSBS Question Paper.';

/** Max accepted PDF size in bytes (10 MB) — keeps Storage usage within the
 *  Firebase free tier across hundreds of contributors. */
export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

/** Max accepted preview/thumbnail image size in bytes (2 MB). */
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

export const ACCEPTED_PDF_MIME_TYPES = ['application/pdf'] as const;
export const ACCEPTED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
