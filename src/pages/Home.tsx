import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  APP_NAME, 
  COLLEGE_NAME, 
  DEPARTMENT_NAME, 
  TAGLINE 
} from '@/config/constants';
import { getSubjects, getPapers } from '@/services/dbService';
import type { Subject, Paper } from '@/types';
import { SEMESTERS } from '@/types';
import { Search, BookOpen, GraduationCap, FileText, Download, AlertCircle } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [latestPapers, setLatestPapers] = useState<Paper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [activeSubjects, recentPapers] = await Promise.all([
          getSubjects(false),
          getPapers({ status: 'approved', limitCount: 5 })
        ]);
        setSubjects(activeSubjects);
        setLatestPapers(recentPapers);
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSubjects([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const matches = subjects.filter(
      (sub) =>
        sub.name.toLowerCase().includes(query) ||
        sub.code.toLowerCase().includes(query)
    );
    setFilteredSubjects(matches.slice(0, 5));
  }, [searchQuery, subjects]);

  const handleSelectSubject = (subjectId: string) => {
    navigate(`/browse?subjectId=${subjectId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredSubjects.length > 0) {
      handleSelectSubject(filteredSubjects[0].id);
    } else if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleDownload = async (paper: Paper) => {
    if (!paper.pdfUrl) return;
    try {
      window.open(paper.pdfUrl, '_blank');
      // Increment download count in Firestore
      const { incrementDownloadCount } = await import('@/services/dbService');
      await incrementDownloadCount(paper.id);
      // Update local state
      setLatestPapers(prev => 
        prev.map(p => p.id === paper.id ? { ...p, downloadCount: p.downloadCount + 1 } : p)
      );
    } catch (err) {
      console.error('Download tracking failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 py-20 text-white md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="container mx-auto max-w-6xl px-6 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300 ring-1 ring-indigo-400/20">
            <GraduationCap className="h-4 w-4" /> {COLLEGE_NAME}
          </p>
          <p className="mt-4 text-xs font-medium uppercase tracking-widest text-slate-400">
            {DEPARTMENT_NAME}
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            {APP_NAME}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 md:text-xl">
            {TAGLINE}
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-10 max-w-xl">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject code or name (e.g. CS404)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl bg-white/10 py-3.5 pl-12 pr-4 text-white placeholder-slate-400 backdrop-blur-md outline-none ring-1 ring-white/10 transition-all focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 focus:ring-indigo-500 dark:focus:bg-slate-800 dark:focus:text-white"
              />
              {/* Autocomplete dropdown */}
              {filteredSubjects.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-800 z-50 text-left">
                  {filteredSubjects.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSelectSubject(sub.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-slate-700/50"
                    >
                      <BookOpen className="h-4 w-4 text-indigo-500" />
                      <div className="flex-1 truncate">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{sub.code}</span>
                        <span className="mx-2 text-slate-400">•</span>
                        <span className="text-slate-600 dark:text-slate-300">{sub.name}</span>
                      </div>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 dark:bg-slate-900 dark:text-indigo-400">
                        Sem {sub.semester}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Main Grid Section */}
      <section className="container mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-3">
          
          {/* Semester Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Browse by Semester
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select a semester to explore all subjects and available question papers.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {SEMESTERS.map((sem) => (
                <button
                  key={sem}
                  onClick={() => navigate(`/browse?semester=${sem}`)}
                  className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:border-indigo-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-indigo-400"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-500 group-hover:text-white dark:bg-slate-800 dark:text-indigo-400 dark:group-hover:bg-indigo-400">
                    <span className="text-lg font-bold">{sem}</span>
                  </div>
                  <span className="mt-4 font-semibold text-slate-800 dark:text-slate-200">
                    Semester {sem}
                  </span>
                  <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    View subjects
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Side: Latest Uploads */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Latest Uploads
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Recently approved student contributions.
            </p>
            
            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                </div>
              ) : latestPapers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-xs">No approved papers yet.</p>
                </div>
              ) : (
                latestPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
                        {paper.subjectCode} - {paper.subjectName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {paper.examType} ({paper.academicYear})
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                        <span>By {paper.uploadedByName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Download className="h-3 w-3" /> {paper.downloadCount}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(paper)}
                      className="rounded-lg bg-slate-50 p-1.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </section>
    </div>
  );
}
