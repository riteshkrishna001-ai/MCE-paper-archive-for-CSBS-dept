import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getSubjects, getAcademicYears, getPapers, incrementDownloadCount, getPaperPdfUrl } from '@/services/dbService';
import type { Subject, AcademicYearRecord, Paper } from '@/types';
import { SEMESTERS, EXAM_TYPES, EXAM_TYPE_LABELS } from '@/types';
import { FileText, Download, Upload, AlertCircle, RefreshCw, Search } from 'lucide-react';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter states (syncing with URL query params)
  const semesterParam = searchParams.get('semester');
  const subjectIdParam = searchParams.get('subjectId');
  const yearParam = searchParams.get('academicYear');
  const examTypeParam = searchParams.get('examType');
  const searchParam = searchParams.get('search') || '';

  // Data states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearRecord[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all required data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [loadedSubjects, loadedYears, loadedPapers] = await Promise.all([
          getSubjects(false),
          getAcademicYears(),
          getPapers({ status: 'approved' })
        ]);
        setSubjects(loadedSubjects);
        setAcademicYears(loadedYears);
        setPapers(loadedPapers);
      } catch (err) {
        console.error('Failed to load browse data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update specific filter in searchParams
  const updateFilter = (key: string, value: string | null) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    // If semester is changed, clear selected subject
    if (key === 'semester') {
      nextParams.delete('subjectId');
    }
    setSearchParams(nextParams);
  };

  const handleDownload = async (paper: Paper) => {
    try {
      const pdfUrl = await getPaperPdfUrl(paper);
      if (!pdfUrl) return;
      window.open(pdfUrl, '_blank');
      await incrementDownloadCount(paper.id);
      // Increment counter in local state
      setPapers((prev) =>
        prev.map((p) => (p.id === paper.id ? { ...p, downloadCount: p.downloadCount + 1 } : p))
      );
    } catch (err) {
      console.error('Download tracking failed:', err);
    }
  };

  // Filter subjects based on selected semester and text search
  const filteredSubjects = subjects.filter((sub) => {
    if (semesterParam && sub.semester !== Number(semesterParam)) return false;
    if (subjectIdParam && sub.id !== subjectIdParam) return false;
    
    if (searchParam) {
      const q = searchParam.toLowerCase();
      return sub.name.toLowerCase().includes(q) || sub.code.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 py-10">
      <div className="container mx-auto max-w-6xl px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Browse Question Papers
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Find exams by semester, subject, academic year, and test type.
            </p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
          >
            <Upload className="h-4 w-4" /> Contribute a Paper
          </button>
        </div>

        {/* Search & Filters Controls */}
        <div className="grid gap-4 md:grid-cols-4 bg-white dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 shadow-sm">
          
          {/* Search text */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchParam}
              onChange={(e) => updateFilter('search', e.target.value || null)}
              className="w-full rounded-xl bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-indigo-500 dark:bg-slate-900 dark:ring-slate-800"
            />
          </div>

          {/* Semester dropdown */}
          <div>
            <select
              value={semesterParam || ''}
              onChange={(e) => updateFilter('semester', e.target.value || null)}
              className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-indigo-500 dark:bg-slate-900 dark:ring-slate-800"
            >
              <option value="">All Semesters</option>
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          {/* Academic Year dropdown */}
          <div>
            <select
              value={yearParam || ''}
              onChange={(e) => updateFilter('academicYear', e.target.value || null)}
              className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-indigo-500 dark:bg-slate-900 dark:ring-slate-800"
            >
              <option value="">All Academic Years</option>
              {academicYears.map((yr) => (
                <option key={yr.id} value={yr.year}>{yr.year}</option>
              ))}
            </select>
          </div>

          {/* Exam Type dropdown */}
          <div>
            <select
              value={examTypeParam || ''}
              onChange={(e) => updateFilter('examType', e.target.value || null)}
              className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-indigo-500 dark:bg-slate-900 dark:ring-slate-800"
            >
              <option value="">All Exam Types</option>
              {EXAM_TYPES.map((type) => (
                <option key={type} value={type}>{EXAM_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Clear Filters Button */}
        {(semesterParam || subjectIdParam || yearParam || examTypeParam || searchParam) && (
          <div className="flex justify-start mb-6">
            <button
              onClick={() => setSearchParams({})}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              <RefreshCw className="h-3 w-3" /> Clear all filters
            </button>
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">Loading catalog...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No Subjects Found</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredSubjects.map((subject) => {
              // Get papers for this subject
              const subjectPapers = papers.filter((p) => p.subjectId === subject.id);
              
              return (
                <div
                  key={subject.id}
                  className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
                >
                  {/* Subject details */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
                          Semester {subject.semester}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{subject.code}</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        {subject.name}
                      </h2>
                    </div>
                  </div>

                  {/* Papers list for this subject */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    
                    {/* Map possible exam configurations or show existing papers */}
                    {/* Let's show existing papers for this subject, filtered by year / exam type if selected */}
                    {(() => {
                      const displayedPapers = subjectPapers.filter((p) => {
                        if (yearParam && p.academicYear !== yearParam) return false;
                        if (examTypeParam && p.examType !== examTypeParam) return false;
                        return true;
                      });

                      if (displayedPapers.length === 0) {
                        return (
                          <div className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400">
                            <p className="text-xs">No papers found matching filters for this subject.</p>
                            <button
                              onClick={() => navigate(`/upload?subjectId=${subject.id}&semester=${subject.semester}`)}
                              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              <Upload className="h-3.5 w-3.5" /> Upload one now
                            </button>
                          </div>
                        );
                      }

                      return displayedPapers.map((paper) => (
                        <div
                          key={paper.id}
                          className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-850 dark:bg-slate-800/20 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                <FileText className="h-3.5 w-3.5" />
                                {EXAM_TYPE_LABELS[paper.examType]}
                              </span>
                              {paper.academicYear && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {paper.academicYear}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-slate-400 mt-3">
                              Uploaded by {paper.uploadedByName}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-4 pt-3">
                            <span className="text-[10px] text-slate-400">
                              {paper.downloadCount} download{paper.downloadCount !== 1 ? 's' : ''}
                            </span>
                            <button
                              onClick={() => handleDownload(paper)}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-500 dark:hover:text-white transition-colors"
                            >
                              <Download className="h-3 w-3" /> Download
                            </button>
                          </div>
                        </div>
                      ));
                    })()}

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
