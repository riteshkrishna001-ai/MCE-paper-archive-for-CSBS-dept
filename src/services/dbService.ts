import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  runTransaction,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage, COLLECTIONS } from '@/config/firebase';
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

/** Check if a paper already exists matching the subject, year, examType, and status approved/pending. */
export async function checkDuplicatePaper(
  subjectId: string,
  academicYear: AcademicYear,
  examType: ExamType
): Promise<Paper | null> {
  const papersRef = collection(db, COLLECTIONS.PAPERS);
  const q = query(
    papersRef,
    where('subjectId', '==', subjectId),
    where('academicYear', '==', academicYear),
    where('examType', '==', examType),
    where('status', 'in', ['approved', 'pending'])
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Paper;
}

/** 
 * Upload a paper PDF to Firebase Storage and create a Firestore document.
 * This also updates the user's upload count in a transaction.
 */
export function uploadPaperFile(
  file: File,
  uid: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; path: string }> {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `papers/${uid}/${timestamp}_${cleanFileName}`;
    const fileRef = ref(storage, storagePath);
    
    const uploadTask = uploadBytesResumable(fileRef, file);
    
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ url: downloadUrl, path: storagePath });
      }
    );
  });
}

/** Save the paper document details to Firestore. */
export async function createPaperRecord(
  paperData: Omit<
    Paper,
    'id' | 'status' | 'rejectionReason' | 'reviewedBy' | 'reviewedAt' | 'downloadCount' | 'uploadDate' | 'lastUpdated'
  >
): Promise<string> {
  const papersRef = collection(db, COLLECTIONS.PAPERS);
  const newDocRef = doc(papersRef);
  const now = Date.now();
  
  const newPaper: Omit<Paper, 'id'> = {
    ...paperData,
    status: 'pending',
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    downloadCount: 0,
    uploadDate: now,
    lastUpdated: now,
  };

  // Run as a transaction to ensure atomic increment of uploader's count
  await runTransaction(db, async (transaction) => {
    const userDocRef = doc(db, COLLECTIONS.USERS, paperData.uploadedBy);
    const userSnap = await transaction.get(userDocRef);
    
    transaction.set(newDocRef, newPaper);
    if (userSnap.exists()) {
      transaction.update(userDocRef, {
        uploadCount: increment(1),
        updatedAt: now,
      });
    }
  });

  return newDocRef.id;
}

// ==========================================
// 3. Admin Moderation
// ==========================================

/** Approve a pending paper. */
export async function approvePaper(paperId: string, adminUid: string): Promise<void> {
  const paperRef = doc(db, COLLECTIONS.PAPERS, paperId);
  const now = Date.now();
  
  await runTransaction(db, async (transaction) => {
    const paperSnap = await transaction.get(paperRef);
    if (!paperSnap.exists()) throw new Error('Paper does not exist');
    
    const paper = paperSnap.data() as Paper;
    if (paper.status === 'approved') return;

    transaction.update(paperRef, {
      status: 'approved',
      reviewedBy: adminUid,
      reviewedAt: now,
      lastUpdated: now,
    });

    // Update contributor's approvedCount
    const contributorRef = doc(db, COLLECTIONS.USERS, paper.uploadedBy);
    const contributorSnap = await transaction.get(contributorRef);
    if (contributorSnap.exists()) {
      transaction.update(contributorRef, {
        approvedCount: increment(1),
        updatedAt: now,
      });
    }
  });
}

/** Reject a pending paper with a reason. */
export async function rejectPaper(
  paperId: string,
  adminUid: string,
  reason: string
): Promise<void> {
  const paperRef = doc(db, COLLECTIONS.PAPERS, paperId);
  const now = Date.now();
  
  await runTransaction(db, async (transaction) => {
    const paperSnap = await transaction.get(paperRef);
    if (!paperSnap.exists()) throw new Error('Paper does not exist');
    
    const paper = paperSnap.data() as Paper;
    
    transaction.update(paperRef, {
      status: 'rejected',
      rejectionReason: reason,
      reviewedBy: adminUid,
      reviewedAt: now,
      lastUpdated: now,
    });

    // If the paper was previously approved, decrement uploader's approvedCount
    if (paper.status === 'approved') {
      const contributorRef = doc(db, COLLECTIONS.USERS, paper.uploadedBy);
      const contributorSnap = await transaction.get(contributorRef);
      if (contributorSnap.exists()) {
        transaction.update(contributorRef, {
          approvedCount: increment(-1),
          updatedAt: now,
        });
      }
    }
  });
}

/** Atomically increment paper download count. */
export async function incrementDownloadCount(paperId: string): Promise<void> {
  const paperRef = doc(db, COLLECTIONS.PAPERS, paperId);
  await updateDoc(paperRef, {
    downloadCount: increment(1),
  });
}
