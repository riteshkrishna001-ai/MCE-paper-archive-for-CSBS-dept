import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/config/firebase';
import type {
  Subject,
  AcademicYearRecord,
  Paper,
  PaperStatus,
  SemesterNumber,
  AcademicYear,
  ExamType,
} from '@/types';

// ==========================================
// 1. Subjects & Academic Years
// ==========================================

/** Fetch all subjects, optionally including inactive ones. */
export async function getSubjects(includeInactive = false): Promise<Subject[]> {
  const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);
  let q = query(subjectsRef, orderBy('semester', 'asc'), orderBy('code', 'asc'));
  
  if (!includeInactive) {
    q = query(subjectsRef, where('isActive', '==', true), orderBy('semester', 'asc'), orderBy('code', 'asc'));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Subject);
}

/** Fetch all active academic years. */
export async function getAcademicYears(): Promise<AcademicYearRecord[]> {
  const yearsRef = collection(db, COLLECTIONS.ACADEMIC_YEARS);
  const q = query(yearsRef, where('isActive', '==', true), orderBy('year', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AcademicYearRecord);
}

/** Create a new subject (Admin only, enforced by rules). */
export async function addSubject(subject: Omit<Subject, 'createdAt' | 'isActive'>): Promise<void> {
  const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subject.id.toLowerCase());
  const now = Date.now();
  await setDoc(subjectRef, {
    ...subject,
    id: subject.id.toLowerCase(),
    isActive: true,
    createdAt: now,
  });
}

/** Create a new academic year (Admin only, enforced by rules). */
export async function addAcademicYear(year: AcademicYear): Promise<void> {
  const yearRef = doc(db, COLLECTIONS.ACADEMIC_YEARS, year);
  const now = Date.now();
  await setDoc(yearRef, {
    id: year,
    year,
    isActive: true,
    createdAt: now,
  });
}

// ==========================================
// 2. Papers CRUD & Queries
// ==========================================

interface PaperFilters {
  semester?: SemesterNumber;
  subjectId?: string;
  academicYear?: AcademicYear;
  examType?: ExamType;
  status?: PaperStatus;
  limitCount?: number;
}

/** Query papers with flexible filtering. */
export async function getPapers(filters: PaperFilters = {}): Promise<Paper[]> {
  const papersRef = collection(db, COLLECTIONS.PAPERS);
  const constraints: any[] = [];

  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters.semester) {
    constraints.push(where('semester', '==', Number(filters.semester)));
  }
  if (filters.subjectId) {
    constraints.push(where('subjectId', '==', filters.subjectId));
  }
  if (filters.academicYear) {
    constraints.push(where('academicYear', '==', filters.academicYear));
  }
  if (filters.examType) {
    constraints.push(where('examType', '==', filters.examType));
  }

  // Order by uploadDate desc by default
  constraints.push(orderBy('uploadDate', 'desc'));

  if (filters.limitCount) {
    constraints.push(limit(filters.limitCount));
  }

  const q = query(papersRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Paper);
}

/** Check if a paper already exists matching the subject, examType, and optional academicYear. */
export async function checkDuplicatePaper(
  subjectId: string,
  examType: ExamType,
  academicYear?: AcademicYear
): Promise<Paper | null> {
  try {
    const papersRef = collection(db, COLLECTIONS.PAPERS);
    const constraints: any[] = [
      where('subjectId', '==', subjectId),
      where('examType', '==', examType),
    ];
    if (academicYear) {
      constraints.push(where('academicYear', '==', academicYear));
    }
    const q = query(papersRef, ...constraints);
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const existing = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as Paper))
      .find((p) => p.status === 'approved' || p.status === 'pending');

    return existing || null;
  } catch (err) {
    console.error('Duplicate check failed:', err);
    return null;
  }
}

/** Reads a File into a Base64 data string. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
  });
}

/** 
 * Prepare paper PDF file for upload by converting it to Base64.
 * First tries Firebase Storage; if Storage is unavailable/unprovisioned,
 * falls back seamlessly to zero-cost Firestore storage.
 */
export async function uploadPaperFile(
  file: File,
  uid: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; path: string; base64Data: string }> {
  if (onProgress) onProgress(20);
  const base64Data = await fileToBase64(file);
  if (onProgress) onProgress(60);

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const timestamp = Date.now();
  const storagePath = `papers/${uid}/${timestamp}_${cleanFileName}`;

  return {
    url: 'firestore:pending',
    path: storagePath,
    base64Data,
  };
}

/** Save the paper document details to Firestore. */
export async function createPaperRecord(
  paperData: Omit<
    Paper,
    'id' | 'status' | 'rejectionReason' | 'reviewedBy' | 'reviewedAt' | 'downloadCount' | 'uploadDate' | 'lastUpdated'
  > & { base64Data?: string },
  onProgress?: (progress: number) => void
): Promise<string> {
  const { base64Data, ...data } = paperData;
  const papersRef = collection(db, COLLECTIONS.PAPERS);
  const newDocRef = doc(papersRef);
  const now = Date.now();

  let pdfUrl = data.pdfUrl;
  let pdfStoragePath = data.pdfStoragePath;

  // If Firebase Storage was skipped, store PDF inline or chunked in Firestore
  if (base64Data && (pdfUrl === 'firestore:pending' || !pdfUrl)) {
    const CHUNK_SIZE = 500 * 1024; // 500 KB per chunk document

    if (base64Data.length <= CHUNK_SIZE) {
      pdfUrl = base64Data;
      pdfStoragePath = 'firestore:inline';
      if (onProgress) onProgress(90);
    } else {
      pdfUrl = 'firestore:chunked';
      pdfStoragePath = 'firestore:chunked';

      const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
      const chunksCol = collection(db, COLLECTIONS.PAPERS, newDocRef.id, 'chunks');

      for (let i = 0; i < totalChunks; i++) {
        const chunkStr = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const chunkDoc = doc(chunksCol, `chunk_${i}`);
        await setDoc(chunkDoc, {
          index: i,
          data: chunkStr,
        });
        if (onProgress) {
          onProgress(60 + Math.round(((i + 1) / totalChunks) * 35));
        }
      }
    }
  }

  const rawPaper: Omit<Paper, 'id'> = {
    ...data,
    pdfUrl,
    pdfStoragePath,
    academicYear: data.academicYear || null,
    previewImageUrl: data.previewImageUrl || null,
    previewImageStoragePath: data.previewImageStoragePath || null,
    uploadedByName: data.uploadedByName || 'Student Contributor',
    uploadedByEmail: data.uploadedByEmail || '',
    status: 'pending',
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    downloadCount: 0,
    uploadDate: now,
    lastUpdated: now,
  };

  // Convert any remaining undefined values to null to avoid Firestore SDK errors
  const newPaper = JSON.parse(JSON.stringify(rawPaper));

  // Create paper document directly to ensure upload never hangs
  await setDoc(newDocRef, newPaper);

  // Safely attempt to increment user upload count
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, data.uploadedBy);
    await updateDoc(userDocRef, {
      uploadCount: increment(1),
      updatedAt: now,
    });
  } catch (userErr) {
    console.warn('Failed to update user upload count stats:', userErr);
  }

  if (onProgress) onProgress(100);
  return newDocRef.id;
}

/** Cache resolved blob URLs in memory to prevent re-fetching chunks. */
const blobUrlCache = new Map<string, string>();

/**
 * Resolves a paper's PDF URL (Firebase Storage URL, inline Data URL, or Firestore chunks)
 * to a downloadable/viewable URL.
 */
export async function getPaperPdfUrl(paper: Paper): Promise<string> {
  if (!paper.pdfUrl) return '';

  // Direct Storage download URL or inline Base64 data URL
  if (paper.pdfUrl.startsWith('http') || paper.pdfUrl.startsWith('data:')) {
    return paper.pdfUrl;
  }

  // Return cached Blob URL if available
  if (blobUrlCache.has(paper.id)) {
    return blobUrlCache.get(paper.id)!;
  }

  // Fetch chunked PDF data from Firestore subcollection
  if (paper.pdfUrl === 'firestore:chunked') {
    try {
      const chunksCol = collection(db, COLLECTIONS.PAPERS, paper.id, 'chunks');
      const q = query(chunksCol, orderBy('index', 'asc'));
      const snapshot = await getDocs(q);

      const fullBase64 = snapshot.docs.map((d) => d.data().data).join('');

      const fetchRes = await fetch(fullBase64);
      const blob = await fetchRes.blob();
      const objectUrl = URL.createObjectURL(blob);

      blobUrlCache.set(paper.id, objectUrl);
      return objectUrl;
    } catch (err) {
      console.error('Failed to reconstruct chunked PDF:', err);
      return '';
    }
  }

  return paper.pdfUrl;
}

// ==========================================
// 3. Admin Moderation
// ==========================================

/** Approve a pending paper. */
export async function approvePaper(paperId: string, adminUid: string): Promise<void> {
  const paperRef = doc(db, COLLECTIONS.PAPERS, paperId);
  const now = Date.now();
  
  const paperSnap = await getDoc(paperRef);
  if (!paperSnap.exists()) throw new Error('Paper does not exist');
  
  const paper = paperSnap.data() as Paper;
  if (paper.status === 'approved') return;

  // 1. Update Paper status directly
  await updateDoc(paperRef, {
    status: 'approved',
    reviewedBy: adminUid,
    reviewedAt: now,
    lastUpdated: now,
  });

  // 2. Increment contributor's approvedCount (safely non-blocking)
  if (paper.uploadedBy) {
    try {
      const contributorRef = doc(db, COLLECTIONS.USERS, paper.uploadedBy);
      await updateDoc(contributorRef, {
        approvedCount: increment(1),
        updatedAt: now,
      });
    } catch (userErr) {
      console.warn('Could not update contributor approvedCount:', userErr);
    }
  }
}

/** Reject a pending paper with a reason. */
export async function rejectPaper(
  paperId: string,
  adminUid: string,
  reason: string
): Promise<void> {
  const paperRef = doc(db, COLLECTIONS.PAPERS, paperId);
  const now = Date.now();
  
  const paperSnap = await getDoc(paperRef);
  if (!paperSnap.exists()) throw new Error('Paper does not exist');
  
  const paper = paperSnap.data() as Paper;
  
  // 1. Update Paper status directly
  await updateDoc(paperRef, {
    status: 'rejected',
    rejectionReason: reason,
    reviewedBy: adminUid,
    reviewedAt: now,
    lastUpdated: now,
  });

  // 2. If the paper was previously approved, decrement uploader's approvedCount
  if (paper.status === 'approved' && paper.uploadedBy) {
    try {
      const contributorRef = doc(db, COLLECTIONS.USERS, paper.uploadedBy);
      await updateDoc(contributorRef, {
        approvedCount: increment(-1),
        updatedAt: now,
      });
    } catch (userErr) {
      console.warn('Could not update contributor approvedCount:', userErr);
    }
  }
}

/** Atomically increment paper download count. */
export async function incrementDownloadCount(paperId: string): Promise<void> {
  const paperRef = doc(db, COLLECTIONS.PAPERS, paperId);
  await updateDoc(paperRef, {
    downloadCount: increment(1),
  });
}
