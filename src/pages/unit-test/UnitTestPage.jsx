import { useState, useEffect, useRef } from 'react';
import { getSyllabuses, getClasses, getSubjects, getChapters } from '@/api/config.api';
import { downloadPaperPDF, sharePaper } from '@/utils/paperActions';
import {
  generateUnitTestPaper,
  getMyPapers,
  deletePaper,
  evaluatePaper,
  getResult,
} from '@/api/unit-test.api';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const scoreColor = (pct) => {
  if (pct >= 75) return 'text-emerald-600';
  if (pct >= 50) return 'text-amber-500';
  return 'text-red-500';
};

const scoreBg = (pct) => {
  if (pct >= 75) return 'bg-emerald-50 border-emerald-200';
  if (pct >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
};

const scoreLabel = (pct) => {
  if (pct >= 90) return 'Outstanding!';
  if (pct >= 75) return 'Well Done!';
  if (pct >= 60) return 'Good Effort';
  if (pct >= 40) return 'Keep Practising';
  return 'Needs Improvement';
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionDivider({ title }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function SelectBox({ label, value, onChange, options, placeholder, disabled }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o._id} value={o._id}>
            {o.name || o.title}
            {o.grade ? ` (Grade ${o.grade})` : ''}
            {o.chapterNumber ? ` — Ch. ${o.chapterNumber}: ${o.title}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Screens ───────────────────────────────────────────────────────────────────

/* HomeScreen */
function HomeScreen({ papersCount, onGenerate, onMyPapers }) {
  return (
    <div className="flex flex-col flex-1 px-4 py-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Unit Test</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate AI-powered question papers and get your answers evaluated instantly.
        </p>
      </div>

      {/* Generate card */}
      <button
        onClick={onGenerate}
        className="w-full rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-left text-white shadow-lg active:scale-95 transition-transform"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-lg">Generate New Paper</p>
            <p className="text-white/80 text-sm mt-0.5">
              Choose chapters · Set marks · Get a full question paper
            </p>
          </div>
        </div>
      </button>

      {/* My Papers card */}
      <button
        onClick={onMyPapers}
        className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm active:scale-95 transition-transform"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900">My Papers</p>
            <p className="text-gray-500 text-sm mt-0.5">
              {papersCount > 0 ? `${papersCount} / 4 papers saved` : 'No papers yet'}
            </p>
          </div>
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Info cards */}
      <SectionDivider title="How it works" />
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '📚', label: 'Pick chapters', desc: 'Up to 4' },
          { icon: '📝', label: 'Get paper', desc: 'AI generated' },
          { icon: '📸', label: 'Upload sheet', desc: 'AI evaluates' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="text-2xl mb-1">{item.icon}</div>
            <p className="text-xs font-semibold text-gray-700">{item.label}</p>
            <p className="text-[10px] text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* SetupScreen */
function SetupScreen({ onBack, onGenerate }) {
  const [syllabuses, setSyllabuses] = useState([]);
  const [classes, setClasses]       = useState([]);
  const [subjects, setSubjects]     = useState([]);
  const [chapters, setChapters]     = useState([]);

  const [syllabusId, setSyllabusId]     = useState('');
  const [classLevelId, setClassLevelId] = useState('');
  const [subjectId, setSubjectId]       = useState('');
  const [chapterIds, setChapterIds]     = useState([]);
  const [maxMarks, setMaxMarks]         = useState(100);

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    getSyllabuses().then((r) => setSyllabuses(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!syllabusId) { setClasses([]); setClassLevelId(''); return; }
    getClasses(syllabusId).then((r) => setClasses(r.data.data)).catch(() => {});
    setClassLevelId('');
    setSubjectId('');
    setChapterIds([]);
  }, [syllabusId]);

  useEffect(() => {
    if (!syllabusId || !classLevelId) { setSubjects([]); setSubjectId(''); return; }
    getSubjects(syllabusId, classLevelId).then((r) => setSubjects(r.data.data)).catch(() => {});
    setSubjectId('');
    setChapterIds([]);
  }, [syllabusId, classLevelId]);

  useEffect(() => {
    if (!syllabusId || !classLevelId || !subjectId) { setChapters([]); setChapterIds([]); return; }
    getChapters(syllabusId, classLevelId, subjectId).then((r) => setChapters(r.data.data)).catch(() => {});
    setChapterIds([]);
  }, [syllabusId, classLevelId, subjectId]);

  const toggleChapter = (id) => {
    setChapterIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const handleGenerate = async () => {
    if (!syllabusId || !classLevelId || !subjectId) { setError('Please select syllabus, class, and subject'); return; }
    if (!chapterIds.length) { setError('Please select at least one chapter'); return; }
    setError('');
    setLoading(true);
    try {
      await onGenerate({ syllabusId, classLevelId, subjectId, chapterIds, maxMarks });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-gray-100">
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-bold text-gray-900 text-lg">New Question Paper</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <SelectBox label="Syllabus" value={syllabusId} onChange={setSyllabusId}
          options={syllabuses} placeholder="Select syllabus" />
        <SelectBox label="Class" value={classLevelId} onChange={setClassLevelId}
          options={classes} placeholder="Select class" disabled={!syllabusId} />
        <SelectBox label="Subject" value={subjectId} onChange={setSubjectId}
          options={subjects} placeholder="Select subject" disabled={!classLevelId} />

        {/* Chapter multi-select */}
        {chapters.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              Chapters <span className="text-gray-400 font-normal">(select 1–4)</span>
            </label>
            <div className="space-y-2">
              {chapters.map((ch) => {
                const selected = chapterIds.includes(ch._id);
                const disabled = !selected && chapterIds.length >= 4;
                return (
                  <button
                    key={ch._id}
                    onClick={() => !disabled && toggleChapter(ch._id)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                      selected
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                        : disabled
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 bg-white text-gray-700 active:bg-gray-50'
                    }`}
                  >
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${selected ? 'bg-indigo-500' : 'border border-gray-300 bg-white'}`}>
                      {selected && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">Ch. {ch.chapterNumber}</span>
                    <span className="flex-1 text-xs truncate">{ch.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Max Marks */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">
            Max Marks: <span className="text-indigo-600 font-bold">{maxMarks}</span>
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-6">10</span>
            <input
              type="range" min={10} max={100} step={5} value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
              className="flex-1 accent-indigo-600"
            />
            <span className="text-xs text-gray-400 w-8">100</span>
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-gray-400">
            <span>Section A (MCQ): {Math.round(maxMarks * 0.20)} marks</span>
            <span>Section B (Short): {Math.round(maxMarks * 0.35)} marks</span>
            <span>Section C (Long): {maxMarks - Math.round(maxMarks * 0.20) - Math.round(maxMarks * 0.35)} marks</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={handleGenerate}
          disabled={loading || !syllabusId || !classLevelId || !subjectId || !chapterIds.length}
          className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white disabled:bg-indigo-300 active:bg-indigo-700 transition-colors"
        >
          {loading ? 'Please wait…' : 'Generate Question Paper'}
        </button>
      </div>
    </div>
  );
}

/* GeneratingScreen */
function GeneratingScreen() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 py-10 text-center gap-6">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
        <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">Generating Your Paper</p>
        <p className="text-sm text-gray-500 mt-1">AI is creating your question paper…</p>
        <p className="text-xs text-gray-400 mt-2">This may take up to a minute</p>
      </div>
    </div>
  );
}

/* PaperPreviewScreen */
function PaperPreviewScreen({ paper, onSave, onDiscard }) {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => downloadPaperPDF(paper);

  const handleShare = () =>
    sharePaper(paper, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-bold text-gray-900">Question Paper</h2>
          <p className="text-xs text-gray-500 mt-0.5">{paper.meta?.subjectName} · {paper.maxMarks} marks</p>
        </div>
        {/* Download + Share icon buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            title="Share"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 active:bg-indigo-100"
          >
            {copied ? (
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
          </button>
          <button
            onClick={handleDownload}
            title="Download PDF"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 active:bg-indigo-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
        </div>
      </div>

      {copied && (
        <div className="mx-4 mt-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs text-emerald-700 text-center font-medium">
          Paper text copied to clipboard!
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <pre className="whitespace-pre-wrap font-mono text-xs text-gray-800 leading-relaxed p-4">
            {paper.paperText}
          </pre>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-gray-100 flex gap-3">
        <button
          onClick={onDiscard}
          className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 active:bg-gray-50"
        >
          Discard
        </button>
        <button
          onClick={onSave}
          className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white active:bg-indigo-700"
        >
          Save Paper
        </button>
      </div>
    </div>
  );
}

/* MyPapersScreen */
function MyPapersScreen({ papers, onBack, onGenerate, onUpload, onViewResult, onDelete }) {
  const [deleting, setDeleting]   = useState(null);
  const [copiedId, setCopiedId]   = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this paper and its evaluation?')) return;
    setDeleting(id);
    try {
      await onDelete(id);
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (p) => downloadPaperPDF(p);

  const handleShare = (p) =>
    sharePaper(p, () => {
      setCopiedId(p._id);
      setTimeout(() => setCopiedId(null), 2500);
    });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-gray-100">
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="font-bold text-gray-900 text-lg">My Papers</h2>
          <p className="text-xs text-gray-400">{papers.length} / 4 saved</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {papers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">📄</div>
            <p className="font-semibold text-gray-700">No papers yet</p>
            <p className="text-sm text-gray-400 mt-1">Generate your first unit test paper</p>
          </div>
        )}

        {papers.map((p) => {
          const evaluated = p.status === 'evaluated' || !!p.result;
          return (
            <div key={p._id} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{p.meta?.subjectName}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {p.meta?.chapterTitles?.slice(0, 2).join(', ')}
                    {p.meta?.chapterTitles?.length > 2 && ` +${p.meta.chapterTitles.length - 2} more`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(p.createdAt)} · {p.maxMarks} marks</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${
                  evaluated ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {evaluated ? 'Evaluated' : 'Pending'}
                </span>
              </div>

              {evaluated && p.result && (
                <div className={`rounded-xl border px-3 py-2 mb-3 flex items-center gap-2 ${scoreBg(p.result.percentage)}`}>
                  <span className={`text-lg font-black ${scoreColor(p.result.percentage)}`}>
                    {p.result.marksObtained}/{p.result.maxMarks}
                  </span>
                  <span className={`text-xs font-semibold ${scoreColor(p.result.percentage)}`}>
                    {p.result.percentage}% · {scoreLabel(p.result.percentage)}
                  </span>
                </div>
              )}

              {/* Download / Share row */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleDownload(p)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 py-2 text-xs font-semibold text-indigo-700 active:bg-indigo-100"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={() => handleShare(p)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2 text-xs font-semibold text-gray-700 active:bg-gray-100"
                >
                  {copiedId === p._id ? (
                    <>
                      <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </>
                  )}
                </button>
              </div>

              <div className="flex gap-2">
                {evaluated ? (
                  <button
                    onClick={() => onViewResult(p._id)}
                    className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white active:bg-indigo-700"
                  >
                    View Result
                  </button>
                ) : (
                  <button
                    onClick={() => onUpload(p)}
                    className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white active:bg-indigo-700"
                  >
                    Upload Answer Sheet
                  </button>
                )}
                <button
                  onClick={() => handleDelete(p._id)}
                  disabled={deleting === p._id}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 active:bg-red-100 disabled:opacity-50"
                >
                  {deleting === p._id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {papers.length < 4 && (
        <div className="px-4 py-4 border-t border-gray-100">
          <button
            onClick={onGenerate}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white active:bg-indigo-700"
          >
            + Generate New Paper
          </button>
        </div>
      )}

      {papers.length >= 4 && (
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 text-center">
            You've reached the 4-paper limit. Delete a paper to generate a new one.
          </div>
        </div>
      )}
    </div>
  );
}

/* AnswerUploadScreen */
function AnswerUploadScreen({ paper, onBack, onSubmit }) {
  const [images, setImages]     = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const fileRef = useRef(null);

  const handleFiles = (files) => {
    const valid = Array.from(files).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    );
    const combined = [...images, ...valid].slice(0, 3);
    setImages(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
    setError('');
  };

  const removeImage = (i) => {
    const updated = images.filter((_, idx) => idx !== i);
    const prevUpdated = previews.filter((_, idx) => idx !== i);
    setImages(updated);
    setPreviews(prevUpdated);
  };

  const handleSubmit = async () => {
    if (!images.length) { setError('Please upload at least one image of your answer sheet'); return; }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      images.forEach((f) => fd.append('images', f));
      await onSubmit(paper._id, fd);
    } catch (e) {
      setError(e.response?.data?.message || 'Evaluation failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-gray-100">
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="font-bold text-gray-900">Upload Answer Sheet</h2>
          <p className="text-xs text-gray-500">{paper?.meta?.subjectName} · {paper?.maxMarks} marks</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-xs font-semibold text-blue-700 mb-1">Tips for best results</p>
          <ul className="text-xs text-blue-600 space-y-0.5 list-disc list-inside">
            <li>Write answers clearly in pen</li>
            <li>Number each question</li>
            <li>Ensure good lighting when photographing</li>
            <li>Upload up to 3 images (one per page)</li>
          </ul>
        </div>

        {/* Upload area */}
        <div
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50 px-6 py-8 cursor-pointer active:bg-indigo-100 transition-colors"
        >
          <svg className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-semibold text-indigo-700">Tap to upload photos</p>
            <p className="text-xs text-indigo-400 mt-0.5">JPG, PNG, WebP · Max 10 MB each · Up to 3 images</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Image previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-200">
                <img src={src} alt={`page ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                  Pg {i + 1}
                </div>
              </div>
            ))}
            {previews.length < 3 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="aspect-[3/4] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px] mt-1">Add</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={handleSubmit}
          disabled={loading || !images.length}
          className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white disabled:bg-indigo-300 active:bg-indigo-700 transition-colors"
        >
          {loading ? 'Submitting…' : `Submit for Evaluation (${images.length} image${images.length !== 1 ? 's' : ''})`}
        </button>
      </div>
    </div>
  );
}

/* EvaluatingScreen */
function EvaluatingScreen() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 py-10 text-center gap-6">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-purple-600 animate-spin" />
        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.304 2.798H4.102c-1.334 0-2.304-1.798-1.304-2.798L4.2 15.3" />
        </svg>
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">Evaluating Your Answers</p>
        <p className="text-sm text-gray-500 mt-1">AI is reading and grading your answer sheet…</p>
        <p className="text-xs text-gray-400 mt-2">This usually takes 30–60 seconds</p>
      </div>
    </div>
  );
}

/* ResultScreen */
function ResultScreen({ result, onBack }) {
  const [expandedSec, setExpandedSec]   = useState(null);
  const [expandedQ, setExpandedQ]       = useState({});

  const toggleSec = (i) => setExpandedSec(expandedSec === i ? null : i);
  const toggleQ   = (key) => setExpandedQ((p) => ({ ...p, [key]: !p[key] }));

  const pct = result.percentage ?? 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-gray-100">
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-bold text-gray-900 text-lg">Evaluation Result</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Score hero */}
        <div className={`rounded-2xl border p-5 text-center ${scoreBg(pct)}`}>
          <p className={`text-5xl font-black ${scoreColor(pct)}`}>
            {result.marksObtained}
            <span className="text-2xl font-semibold text-gray-400">/{result.maxMarks}</span>
          </p>
          <p className={`text-lg font-bold mt-1 ${scoreColor(pct)}`}>{pct}%</p>
          <p className="text-sm font-semibold text-gray-600 mt-1">{scoreLabel(pct)}</p>
          {result.meta?.subjectName && (
            <p className="text-xs text-gray-400 mt-1">{result.meta.subjectName}</p>
          )}
        </div>

        {/* Section scores */}
        <div className="space-y-2">
          {(result.sections || []).map((sec, i) => {
            const secPct = sec.totalMarks > 0 ? Math.round((sec.marksObtained / sec.totalMarks) * 100) : 0;
            return (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <button
                  onClick={() => toggleSec(i)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{sec.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${secPct >= 75 ? 'bg-emerald-500' : secPct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${secPct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${scoreColor(secPct)}`}>
                        {sec.marksObtained}/{sec.totalMarks}
                      </span>
                    </div>
                  </div>
                  <svg className={`h-4 w-4 text-gray-400 transition-transform ${expandedSec === i ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {expandedSec === i && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {(sec.questions || []).map((q, qi) => {
                      const key = `${i}-${qi}`;
                      const correct = q.marksAwarded >= q.maxMarks;
                      const partial = q.marksAwarded > 0 && q.marksAwarded < q.maxMarks;
                      return (
                        <div key={qi} className="px-4 py-3">
                          <button
                            onClick={() => toggleQ(key)}
                            className="w-full flex items-start gap-2 text-left"
                          >
                            <span className={`shrink-0 mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              correct ? 'bg-emerald-50 text-emerald-700' : partial ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                            }`}>
                              {q.marksAwarded}/{q.maxMarks}
                            </span>
                            <p className="flex-1 text-xs text-gray-700 font-medium">Q{q.number}</p>
                            <svg className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${expandedQ[key] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>

                          {expandedQ[key] && (
                            <div className="mt-2 space-y-2 text-xs">
                              <div className="rounded-lg bg-gray-50 px-3 py-2">
                                <p className="text-gray-400 font-medium">Your answer</p>
                                <p className="text-gray-700 mt-0.5">{q.studentAnswer || '—'}</p>
                              </div>
                              {q.feedback && (
                                <div className={`rounded-lg px-3 py-2 ${correct ? 'bg-emerald-50' : partial ? 'bg-amber-50' : 'bg-red-50'}`}>
                                  <p className="text-gray-500 font-medium">Feedback</p>
                                  <p className={`mt-0.5 ${correct ? 'text-emerald-700' : partial ? 'text-amber-700' : 'text-red-700'}`}>
                                    {q.feedback}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Overall feedback */}
        {result.overallFeedback && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-xs font-bold text-indigo-700 mb-1">Overall Feedback</p>
            <p className="text-sm text-indigo-800">{result.overallFeedback}</p>
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-2 gap-3">
          {result.strengths?.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-bold text-emerald-700 mb-2">💪 Strengths</p>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-emerald-700">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {result.improvements?.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-bold text-amber-700 mb-2">📈 Improve</p>
              <ul className="space-y-1">
                {result.improvements.map((s, i) => (
                  <li key={i} className="text-xs text-amber-700">• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={onBack}
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white active:bg-indigo-700"
        >
          Back to My Papers
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function UnitTestPage() {
  const [screen, setScreen]               = useState('home');
  const [papers, setPapers]               = useState([]);
  const [papersCount, setPapersCount]     = useState(0);

  const [pendingPaper, setPendingPaper]   = useState(null); // generated but not yet saved
  const [selectedPaper, setSelectedPaper] = useState(null); // for upload / view result
  const [currentResult, setCurrentResult] = useState(null);

  const [error, setError] = useState('');

  // Load papers on mount and when returning to home/papers
  const loadPapers = async () => {
    try {
      const res = await getMyPapers();
      const data = res.data.data;
      setPapers(data.papers || []);
      setPapersCount(data.count || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadPapers();
  }, []);

  // Generate handler (called from SetupScreen)
  const handleGenerate = async (setup) => {
    setScreen('generating');
    try {
      const res = await generateUnitTestPaper(setup);
      const data = res.data.data;
      setPendingPaper(data);
      setScreen('preview');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to generate paper. Please try again.');
      setScreen('setup');
    }
  };

  // Save pending paper — it's already saved in DB during generation; just refresh list
  const handleSavePaper = async () => {
    await loadPapers();
    setPendingPaper(null);
    setScreen('papers');
  };

  // Discard pending paper
  const handleDiscardPaper = () => {
    // Paper was already saved in DB; user chose to discard the preview — still in My Papers
    setPendingPaper(null);
    setScreen('home');
    loadPapers();
  };

  // Delete a paper
  const handleDeletePaper = async (id) => {
    await deletePaper(id);
    await loadPapers();
  };

  // Upload & evaluate
  const handleEvaluate = async (paperId, formData) => {
    setScreen('evaluating');
    try {
      const res = await evaluatePaper(paperId, formData);
      setCurrentResult(res.data.data);
      setScreen('result');
      await loadPapers(); // update paper status
    } catch (e) {
      setError(e.response?.data?.message || 'Evaluation failed. Please try again.');
      setScreen('upload');
      throw e; // let AnswerUploadScreen catch it
    }
  };

  // View existing result
  const handleViewResult = async (paperId) => {
    try {
      const res = await getResult(paperId);
      setCurrentResult(res.data.data);
      setScreen('result');
    } catch {
      setError('Could not load result. Please try again.');
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {screen === 'home' && (
        <HomeScreen
          papersCount={papersCount}
          onGenerate={() => { setError(''); setScreen('setup'); }}
          onMyPapers={() => { setError(''); setScreen('papers'); }}
        />
      )}

      {screen === 'setup' && (
        <SetupScreen
          onBack={() => setScreen('home')}
          onGenerate={handleGenerate}
        />
      )}

      {screen === 'generating' && <GeneratingScreen />}

      {screen === 'preview' && pendingPaper && (
        <PaperPreviewScreen
          paper={pendingPaper}
          onSave={handleSavePaper}
          onDiscard={handleDiscardPaper}
        />
      )}

      {screen === 'papers' && (
        <MyPapersScreen
          papers={papers}
          onBack={() => setScreen('home')}
          onGenerate={() => { setError(''); setScreen('setup'); }}
          onUpload={(p) => { setSelectedPaper(p); setError(''); setScreen('upload'); }}
          onViewResult={handleViewResult}
          onDelete={handleDeletePaper}
        />
      )}

      {screen === 'upload' && selectedPaper && (
        <AnswerUploadScreen
          paper={selectedPaper}
          onBack={() => setScreen('papers')}
          onSubmit={handleEvaluate}
        />
      )}

      {screen === 'evaluating' && <EvaluatingScreen />}

      {screen === 'result' && currentResult && (
        <ResultScreen
          result={currentResult}
          onBack={() => { setScreen('papers'); loadPapers(); }}
        />
      )}

      {/* Global error (for navigation transitions) */}
      {error && screen !== 'setup' && screen !== 'upload' && (
        <div className="fixed bottom-20 left-4 right-4 z-50 rounded-xl bg-red-600 px-4 py-3 text-sm text-white shadow-lg text-center">
          {error}
          <button onClick={() => setError('')} className="ml-3 font-bold underline">✕</button>
        </div>
      )}
    </div>
  );
}
