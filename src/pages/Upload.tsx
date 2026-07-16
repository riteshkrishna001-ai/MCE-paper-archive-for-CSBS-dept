import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getSubjects, getAcademicYears, checkDuplicatePaper, uploadPaperFile, createPaperRecord } from '@/services/dbService';
import { MAX_PDF_SIZE_BYTES } from '@/config/constants';
import type { Subject, AcademicYearRecord, ExamType, SemesterNumber } from '@/types';
import { EXAM_TYPES, EXAM_TYPE_LABELS, SEMESTERS } from '@/types';
import { Upload as UploadIcon, FileText, CheckCircle2, AlertTriangle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Upload() {
  const { currentUser, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Step state: 1 = File selection, 2 = Metadata form, 3 = Duplicate check & submit
  const [step, setStep] = useState(1);

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [semester, setSemester] = useState<SemesterNumber | ''>('');
  const [subjectId, setSubjectId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [examType, setExamType] = useState<ExamType | ''>('');

  // Dropdown options loaded from Firestore
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Submission/Verification states
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial state with query parameters
  useEffect(() => {
    const semParam = searchParams.get('semester');
    const subParam = searchParams.get('subjectId');
    if (semParam) setSemester(Number(semParam) as SemesterNumber);
    if (subParam) setSubjectId(subParam);
  }, [searchParams]);

  // Load subjects and years
  useEffect(() => {
    async function loadData() {
      try {
        const [loadedSubjects, loadedYears] = await Promise.all([
          getSubjects(false),
          getAcademicYears(),
        ]);
        setSubjects(loadedSubjects);
        setAcademicYears(loadedYears);
      } catch (err) {
        console.error('Failed to load form options:', err);
        toast.error('Failed to load subjects or academic years.');
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  // Filter subjects by chosen semester
  const filteredSubjects = subjects.filter((sub) => !semester || sub.semester === semester);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed.');
      return;
    }

    if (selectedFile.size > MAX_PDF_SIZE_BYTES) {
      toast.error('File size exceeds the 10MB limit.');
      return;
    }

    setFile(selectedFile);
    setStep(2);
  };

  const handleNextToConfirmation = async () => {
    if (!semester || !subjectId || !academicYear || !examType || !file) {
      toast.error('Please fill in all details.');
      return;
    }

    setCheckingDuplicate(true);
    setDuplicateWarning(null);
    try {
      const duplicate = await checkDuplicatePaper(subjectId, academicYear, examType);
      if (duplicate) {
        if (duplicate.status === 'approved') {
          setDuplicateWarning('An approved question paper already exists for this exact combination. Please verify your details.');
        } else {
          setDuplicateWarning('A paper with these details is currently pending moderation. Uploading another might be flagged as a duplicate.');
        }
      }
      setStep(3);
    } catch (err) {
      console.error('Duplicate check failed:', err);
      toast.error('Could not verify duplicate status.');
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!file || !currentUser || !profile) return;

    setUploading(true);
    setUploadProgress(0);

    const selectedSubject = subjects.find(s => s.id === subjectId);
    if (!selectedSubject) {
      toast.error('Invalid subject selected.');
      setUploading(false);
      return;
    }

    try {
      // 1. Upload File to Storage
      const { url, path } = await uploadPaperFile(file, currentUser.uid, (progress) => {
        setUploadProgress(Math.round(progress));
      });

      // 2. Create DB Record
      await createPaperRecord({
        semester: semester as SemesterNumber,
        subjectId,
        subjectName: selectedSubject.name,
        subjectCode: selectedSubject.code.toUpperCase(),
        academicYear,
        examType: examType as ExamType,
        pdfUrl: url,
        pdfStoragePath: path,
        previewImageUrl: null,
        previewImageStoragePath: null,
        fileSize: file.size,
        uploadedBy: currentUser.uid,
        uploadedByName: profile.displayName,
        uploadedByEmail: profile.email,
      });

      toast.success('Paper uploaded successfully! It is now pending admin review.');
      navigate('/browse');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 py-10">
      <div className="container mx-auto max-w-2xl px-6">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Upload Question Paper
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Contribute to the vault. All uploads are moderated by administrators.
          </p>

          {/* User stats */}
          {profile && (
            <div className="inline-flex items-center gap-6 mt-6 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-100 dark:border-slate-850 px-6 py-3 text-xs">
              <div>
                <span className="text-slate-400">Total Uploaded:</span>{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 text-sm ml-1">{profile.uploadCount}</strong>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <span className="text-slate-400">Approved:</span>{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm ml-1">{profile.approvedCount}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Progress Step Indicator */}
        <div className="flex items-center justify-between px-10 mb-8 text-xs font-semibold text-slate-400">
          <span className={step >= 1 ? 'text-indigo-600 dark:text-indigo-400' : ''}>1. File</span>
          <ArrowRight className="h-3 w-3" />
          <span className={step >= 2 ? 'text-indigo-600 dark:text-indigo-400' : ''}>2. Details</span>
          <ArrowRight className="h-3 w-3" />
          <span className={step >= 3 ? 'text-indigo-600 dark:text-indigo-400' : ''}>3. Verify & Submit</span>
        </div>

        {/* Card wrapper */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="mt-2 text-xs text-slate-400">Loading form configurations...</p>
            </div>
          ) : (
            <>
              {/* STEP 1: FILE SELECTION */}
              {step === 1 && (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-750 rounded-2xl py-12 px-6 text-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="application/pdf"
                    className="hidden"
                  />
                  <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600 dark:bg-slate-900/60 dark:text-indigo-400">
                    <UploadIcon className="h-8 w-8 animate-pulse" />
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900 dark:text-white">Choose Question Paper</h3>
                  <p className="text-xs text-slate-400 mt-1">PDF documents only, up to 10 MB.</p>
                </div>
              )}

              {/* STEP 2: METADATA FORM */}
              {step === 2 && file && (
                <div className="space-y-6">
                  {/* Display selected file */}
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-100 dark:border-slate-850">
                    <FileText className="h-8 w-8 text-indigo-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setStep(1);
                      }}
                      className="text-xs font-semibold text-rose-500 hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    
                    {/* Semester */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Semester</label>
                      <select
                        value={semester}
                        onChange={(e) => {
                          setSemester(Number(e.target.value) as SemesterNumber);
                          setSubjectId(''); // reset subject selection
                        }}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-750 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      >
                        <option value="">Select Semester</option>
                        {SEMESTERS.map((sem: SemesterNumber) => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        )) /* type-cast sem */}
                      </select>
                    </div>

                    {/* Academic Year */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Year</label>
                      <select
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-750 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      >
                        <option value="">Select Academic Year</option>
                        {academicYears.map((yr) => (
                          <option key={yr.id} value={yr.year}>{yr.year}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subject */}
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Subject</label>
                      <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        disabled={!semester}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-750 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:opacity-60"
                      >
                        <option value="">
                          {semester ? 'Select Subject' : 'First select a semester'}
                        </option>
                        {filteredSubjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.code.toUpperCase()} — {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Exam Type */}
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Exam Type</label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {EXAM_TYPES.map((type: ExamType) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setExamType(type)}
                            className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                              examType === type
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-750'
                            }`}
                          >
                            {EXAM_TYPE_LABELS[type]}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-750 pt-6">
                    <button
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </button>
                    <button
                      onClick={handleNextToConfirmation}
                      disabled={checkingDuplicate}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
                    >
                      {checkingDuplicate ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" /> Verifying...
                        </>
                      ) : (
                        <>
                          Continue <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: DUPLICATE WARNING & CONFIRM UPLOAD */}
              {step === 3 && file && (
                <div className="space-y-6">
                  {/* File & Details summary */}
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-750 p-4 bg-slate-50/50 dark:bg-slate-900/40 text-sm space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">File:</span>
                      <strong className="text-slate-900 dark:text-white truncate max-w-xs">{file.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subject:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {subjects.find(s => s.id === subjectId)?.name}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Exam Type:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {examType ? EXAM_TYPE_LABELS[examType] : ''}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Academic Year:</span>
                      <strong className="text-slate-900 dark:text-white">{academicYear}</strong>
                    </div>
                  </div>

                  {/* Duplicate warning notification */}
                  {duplicateWarning ? (
                    <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4 flex gap-3 text-xs text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                      <div>
                        <h4 className="font-bold">Duplicate Warning</h4>
                        <p className="mt-1 leading-relaxed">{duplicateWarning}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-4 flex gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      <div>
                        <h4 className="font-bold">No Duplicates Found</h4>
                        <p className="mt-1 leading-relaxed">This seems to be a new contribution! Your submission will help fellow students once approved.</p>
                      </div>
                    </div>
                  )}

                  {/* Upload state indicator */}
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-500">
                        <span>Uploading files to secure vault...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-750 pt-6">
                    <button
                      onClick={() => setStep(2)}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 disabled:opacity-50"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Edit Details
                    </button>
                    <button
                      onClick={handleFinalSubmit}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          Submit for Approval
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
