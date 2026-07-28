import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getPapers,
  approvePaper,
  rejectPaper,
  getSubjects,
  addSubject,
  getAcademicYears,
  addAcademicYear,
  getPaperPdfUrl,
} from '@/services/dbService';
import { isValidAcademicYear } from '@/types';
import type { Paper, Subject, AcademicYearRecord, SemesterNumber } from '@/types';
import { SEMESTERS, EXAM_TYPE_LABELS } from '@/types';
import { ShieldCheck, Check, X, Eye, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/config/firebase';

type Tab = 'pending' | 'subjects' | 'years';

const PREDEFINED_SUBJECTS: Omit<Subject, 'createdAt' | 'isActive'>[] = [
  // Semester 3
  { id: '24macb301', code: '24MACB301', name: 'Computational Statistics', semester: 3 },
  { id: '24cb302', code: '24CB302', name: 'Operating Systems', semester: 3 },
  { id: '24cb303', code: '24CB303', name: 'Data Structures and its applications', semester: 3 },
  { id: '24cb304', code: '24CB304', name: 'Business Economics', semester: 3 },
  { id: '24cb305', code: '24CB305', name: 'Digital Design and Practices', semester: 3 },
  { id: '24cb306', code: '24CB306', name: 'Unix and Shell Programming Laboratory', semester: 3 },
  { id: '24cb307x', code: '24CB307X', name: 'Engineering Science Course-I', semester: 3 },
  { id: '24cb308x', code: '24CB308X', name: 'Ability Enhancement Course-I', semester: 3 },
  { id: '24scr', code: '24SCR', name: 'Social Connect and Responsibility', semester: 3 },
  { id: '24nyp1', code: '24NYP1', name: 'NSS, Yoga, PE', semester: 3 },

  // Semester 4
  { id: '24macb401', code: '24MACB401', name: 'Linear Algebra', semester: 4 },
  { id: '24cb402', code: '24CB402', name: 'Theoretical Foundations of Computation', semester: 4 },
  { id: '24cb403', code: '24CB403', name: 'Design and Analysis of Algorithms', semester: 4 },
  { id: '24cb404', code: '24CB404', name: 'Database Management Systems', semester: 4 },
  { id: '24cb405', code: '24CB405', name: 'WEB Programming', semester: 4 },
  { id: '24cb406x', code: '24CB406X', name: 'Engineering Science Course-II', semester: 4 },
  { id: '24cb407x', code: '24CB407X', name: 'Ability Enhancement Course-II', semester: 4 },
  { id: '24bok408', code: '24BOK408', name: 'Biology for Engineers', semester: 4 },
  { id: '24uhv', code: '24UHV', name: 'Universal Human Values', semester: 4 },
  { id: '24nyp2', code: '24NYP2', name: 'NSS, Yoga, PE', semester: 4 },

  // Semester 5
  { id: '23cb501', code: '23CB501', name: 'Artificial Intelligence', semester: 5 },
  { id: '23cb502', code: '23CB502', name: 'Data Communications', semester: 5 },
  { id: '23cb503', code: '23CB503', name: 'System Software and Compiler Design', semester: 5 },
  { id: '23cb504', code: '23CB504', name: 'Aptitude and Technical Skills', semester: 5 },
  { id: '23cb55x', code: '23CB55X', name: 'Professional Elective Course-I', semester: 5 },
  { id: '23rip', code: '23RIP', name: 'Research Methodology and IPR', semester: 5 },
  { id: '23evs', code: '23EVS', name: 'Environmental Studies', semester: 5 },
  { id: '23nyp3', code: '23NYP3', name: 'NSS, Yoga, PE', semester: 5 },

  // Semester 6
  { id: '23cb601', code: '23CB601', name: 'Computer Networks', semester: 6 },
  { id: '23cb602', code: '23CB602', name: 'Software Engineering', semester: 6 },
  { id: '23cb603', code: '23CB603', name: 'Data Mining and Warehousing', semester: 6 },
  { id: '23cb604', code: '23CB604', name: 'Mini Project', semester: 6 },
  { id: '23cb605', code: '23CB605', name: 'Main Project Phase I', semester: 6 },
  { id: '23cb66x', code: '23CB66X', name: 'Professional Elective Course-II', semester: 6 },
  { id: '23oecb6x', code: '23OECB6X', name: 'Open Elective Course-I', semester: 6 },
  { id: '23nyp4', code: '23NYP4', name: 'NSS, Yoga, PE', semester: 6 },
  { id: '23ask', code: '23ASK', name: 'Analytical Ability and Soft Skills', semester: 6 },

  // Semester 7
  { id: '22cb701', code: '22CB701', name: 'Business Intelligence', semester: 7 },
  { id: '22cb702', code: '22CB702', name: 'Computer Graphics and Visualization', semester: 7 },
  { id: '22cb703', code: '22CB703', name: 'Business Intelligence and Data Analytics Laboratory', semester: 7 },
  { id: '22cb704', code: '22CB704', name: 'Main Project Phase II', semester: 7 },
  { id: '22cb77x', code: '22CB77X', name: 'Professional Elective Course-III', semester: 7 },
  { id: '22oecb7x', code: '22OECB7X', name: 'Open Elective Course-II', semester: 7 },

  // Semester 8
  { id: '22sw02_pec', code: '22SW02', name: 'Swayam (NPTEL, 12 weeks) — PEC', semester: 8 },
  { id: '22sw02_oec', code: '22SW02', name: 'Swayam (NPTEL, 12 weeks) — OEC', semester: 8 },
  { id: '22int', code: '22INT', name: 'Internship (Research/Industry, 14-20 weeks)', semester: 8 },
];

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('pending');

  // Tab 1: Pending Approvals
  const [pendingPapers, setPendingPapers] = useState<Paper[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [viewingPaper, setViewingPaper] = useState<Paper | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingPaperId, setRejectingPaperId] = useState<string | null>(null);

  useEffect(() => {
    if (!viewingPaper) {
      setPreviewUrl(null);
      return;
    }
    getPaperPdfUrl(viewingPaper).then((url) => setPreviewUrl(url));
  }, [viewingPaper]);

  // Tab 2: Manage Subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubSem, setNewSubSem] = useState<SemesterNumber | ''>('');
  const [submittingSubject, setSubmittingSubject] = useState(false);
  const [seedingSubjects, setSeedingSubjects] = useState(false);

  // Tab 3: Manage Years
  const [academicYears, setAcademicYears] = useState<AcademicYearRecord[]>([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [newYear, setNewYear] = useState('');
  const [submittingYear, setSubmittingYear] = useState(false);

  // Load Pending Papers
  const loadPendingPapers = async () => {
    setLoadingPapers(true);
    try {
      const data = await getPapers({ status: 'pending' });
      setPendingPapers(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pending papers.');
    } finally {
      setLoadingPapers(false);
    }
  };

  // Load Subjects
  const loadSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const data = await getSubjects(true); // include inactive
      setSubjects(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subjects.');
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Load Years
  const loadYears = async () => {
    setLoadingYears(true);
    try {
      const data = await getAcademicYears();
      setAcademicYears(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load academic years.');
    } finally {
      setLoadingYears(false);
    }
  };

  // Trigger loads based on active tab
  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingPapers();
    } else if (activeTab === 'subjects') {
      loadSubjects();
    } else if (activeTab === 'years') {
      loadYears();
    }
  }, [activeTab]);

  // Actions: Approvals
  const handleApprove = async (paperId: string) => {
    if (!currentUser) return;
    try {
      await approvePaper(paperId, currentUser.uid);
      toast.success('Paper approved and published!');
      setPendingPapers((prev) => prev.filter((p) => p.id !== paperId));
      if (viewingPaper?.id === paperId) setViewingPaper(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve paper.');
    }
  };

  const handleReject = async (paperId: string) => {
    if (!currentUser) return;
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    try {
      await rejectPaper(paperId, currentUser.uid, rejectionReason);
      toast.success('Paper rejected.');
      setPendingPapers((prev) => prev.filter((p) => p.id !== paperId));
      setRejectingPaperId(null);
      setRejectionReason('');
      if (viewingPaper?.id === paperId) setViewingPaper(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject paper.');
    }
  };

  // Actions: Manage Subjects
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName || !newSubCode || !newSubSem) {
      toast.error('Please fill in all subject fields.');
      return;
    }
    setSubmittingSubject(true);
    try {
      // Generate ID from code (e.g. 24CB302 -> 24cb302)
      const generatedId = newSubCode.toLowerCase().replace(/[^a-z0-9]/g, '');
      await addSubject({
        id: generatedId,
        name: newSubName,
        code: newSubCode.toUpperCase(),
        semester: Number(newSubSem) as SemesterNumber,
      });
      toast.success('Subject added successfully!');
      setNewSubName('');
      setNewSubCode('');
      setNewSubSem('');
      loadSubjects();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add subject.');
    } finally {
      setSubmittingSubject(false);
    }
  };

  const handleBulkSeed = async () => {
    if (!window.confirm('This will seed/overwrite all standard subjects for Semesters 3 to 8. Do you want to proceed?')) {
      return;
    }
    setSeedingSubjects(true);
    const toastId = toast.loading('Seeding subjects...');
    try {
      let count = 0;
      for (const subject of PREDEFINED_SUBJECTS) {
        await addSubject(subject);
        count++;
      }
      toast.success(`Successfully seeded ${count} subjects!`, { id: toastId });
      loadSubjects();
    } catch (err) {
      console.error(err);
      toast.error('Failed to seed some subjects.', { id: toastId });
    } finally {
      setSeedingSubjects(false);
    }
  };

  const toggleSubjectActive = async (subjectId: string, currentStatus: boolean) => {
    try {
      const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
      await updateDoc(subjectRef, { isActive: !currentStatus });
      toast.success(`Subject ${!currentStatus ? 'activated' : 'deactivated'}!`);
      loadSubjects();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update subject status.');
    }
  };

  // Actions: Manage Years
  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAcademicYear(newYear)) {
      toast.error('Invalid year format. Must be YYYY-YY (e.g. 2024-25).');
      return;
    }
    setSubmittingYear(true);
    try {
      await addAcademicYear(newYear);
      toast.success('Academic year added!');
      setNewYear('');
      loadYears();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add academic year.');
    } finally {
      setSubmittingYear(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 py-10">
      <div className="container mx-auto max-w-6xl px-6">
        
        {/* Title */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-slate-850 dark:text-indigo-400">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Manage student submissions, subjects, and curriculum calendars.
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px mb-8">
          {(['pending', 'subjects', 'years'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'pending' ? 'Pending Approvals' : tab === 'subjects' ? 'Manage Subjects' : 'Academic Years'}
            </button>
          ))}
        </div>

        {/* TAB CONTENT: PENDING APPROVALS */}
        {activeTab === 'pending' && (
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* List queue */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Moderation Queue</h2>
              
              {loadingPapers ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                </div>
              ) : pendingPapers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <Check className="mx-auto h-8 w-8 text-emerald-500" />
                  <p className="mt-2 text-sm font-semibold">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-1">No pending question papers to review.</p>
                </div>
              ) : (
                pendingPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className={`rounded-2xl border bg-white p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                      viewingPaper?.id === paper.id
                        ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                        : 'border-slate-200 dark:border-slate-800 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
                          Sem {paper.semester}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{paper.subjectCode}</span>
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm mt-1.5 truncate">
                        {paper.subjectName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {EXAM_TYPE_LABELS[paper.examType]}{paper.academicYear ? ` (${paper.academicYear})` : ''} • Uploaded by {paper.uploadedByName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => setViewingPaper(paper)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-750"
                        title="View Document"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleApprove(paper.id)}
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/20 dark:text-emerald-400"
                        title="Approve"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setRejectingPaperId(paper.id);
                          setRejectionReason('');
                        }}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-950/20 dark:text-rose-400"
                        title="Reject"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Document Viewer / Reject Panel */}
            <div className="lg:col-span-1 space-y-6">
              {/* PDF Preview Frame */}
              {viewingPaper ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-800/40 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[200px]">
                      {viewingPaper.subjectCode} - {viewingPaper.examType}
                    </h3>
                    <button
                      onClick={() => setViewingPaper(null)}
                      className="text-xs text-slate-400 hover:underline"
                    >
                      Close
                    </button>
                  </div>
                  {previewUrl ? (
                    <iframe
                      src={`${previewUrl}#toolbar=0`}
                      className="w-full h-80 rounded-xl bg-slate-100"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="w-full h-80 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                      Loading preview...
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500 text-xs">
                  <Eye className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-750 mb-2" />
                  Select a document's eye icon to view PDF preview.
                </div>
              )}

              {/* Rejection input */}
              {rejectingPaperId && (
                <div className="rounded-3xl border border-rose-200 bg-rose-50/20 p-5 dark:border-rose-950/40 dark:bg-rose-950/10">
                  <h3 className="font-bold text-sm text-rose-800 dark:text-rose-300">Rejection Reason</h3>
                  <textarea
                    placeholder="Provide a clear description of why this submission is rejected (e.g. Blurry photo, incorrect subject code)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full mt-3 rounded-xl border border-rose-200 bg-white p-3 text-xs outline-none dark:border-rose-950/40 dark:bg-slate-900"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end mt-3">
                    <button
                      onClick={() => setRejectingPaperId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReject(rejectingPaperId)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500"
                    >
                      Submit Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB CONTENT: MANAGE SUBJECTS */}
        {activeTab === 'subjects' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Create subject form */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm h-fit">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Subject</h2>
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 24CB302"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4.5 py-2 text-sm dark:border-slate-750 dark:bg-slate-900 outline-none focus:bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Design and Analysis of Algorithms"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4.5 py-2 text-sm dark:border-slate-750 dark:bg-slate-900 outline-none focus:bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Semester</label>
                  <select
                    value={newSubSem}
                    onChange={(e) => setNewSubSem(Number(e.target.value) as SemesterNumber)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4.5 py-2 text-sm dark:border-slate-750 dark:bg-slate-900 outline-none focus:bg-white"
                  >
                    <option value="">Select Sem</option>
                    {SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={submittingSubject}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-65"
                >
                  <Plus className="h-4 w-4" /> Add Subject
                </button>
              </form>
              <div className="mt-6 pt-6 border-t border-slate-150 dark:border-slate-800">
                <p className="text-[10px] font-medium text-slate-400 mb-2.5">Or populate standard subjects automatically:</p>
                <button
                  type="button"
                  onClick={handleBulkSeed}
                  disabled={seedingSubjects}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-250 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-65 dark:border-slate-750 dark:bg-slate-900/50 dark:text-slate-350 dark:hover:bg-slate-900"
                >
                  <ShieldCheck className="h-4 w-4 text-indigo-500" /> Bulk Seed All Subjects
                </button>
              </div>
            </div>

            {/* List subjects */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Curriculum Subjects</h2>
              {loadingSubjects ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="p-4">Code</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Sem</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {subjects.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-55/10">
                          <td className="p-4 font-mono font-bold text-slate-900 dark:text-white text-xs">{sub.code}</td>
                          <td className="p-4 font-medium max-w-[200px] truncate">{sub.name}</td>
                          <td className="p-4 text-xs">Sem {sub.semester}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              sub.isActive
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {sub.isActive ? 'Active' : 'Retired'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => toggleSubjectActive(sub.id, sub.isActive)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                            >
                              {sub.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT: MANAGE YEARS */}
        {activeTab === 'years' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Create year form */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm h-fit">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Year</h2>
              <form onSubmit={handleAddYear} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024-25"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4.5 py-2 text-sm dark:border-slate-750 dark:bg-slate-900 outline-none focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1">Must strictly follow the YYYY-YY suffix convention.</span>
                </div>
                <button
                  type="submit"
                  disabled={submittingYear}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-65"
                >
                  <Plus className="h-4 w-4" /> Add Year
                </button>
              </form>
            </div>

            {/* List years */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Academic Years</h2>
              {loadingYears ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden max-w-md">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="p-4">Academic Year</th>
                        <th className="p-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {academicYears.map((yr) => (
                        <tr key={yr.id}>
                          <td className="p-4 font-bold text-slate-900 dark:text-white text-sm">{yr.year}</td>
                          <td className="p-4 text-right">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-semibold">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
