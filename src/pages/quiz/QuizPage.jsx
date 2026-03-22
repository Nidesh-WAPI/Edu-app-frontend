import { useState, useEffect, useRef, useCallback } from 'react';
import { getSyllabuses, getClasses, getSubjects, getChapters } from '@/api/config.api';
import { generateQuiz, submitQuiz } from '@/api/quiz.api';
import { playCorrect, playWrong, playComplete } from '@/hooks/useSounds';

/* ── Constants ──────────────────────────────────────────────────────────────── */
const MIN_Q = 5;
const MAX_Q = 30;
const MAX_CHAPTERS = 4;

/* ── Icons ──────────────────────────────────────────────────────────────────── */
const CheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const SpinnerIcon = ({ className = 'h-6 w-6' }) => (
  <svg className={`animate-spin text-indigo-500 ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

/* ── Timer hook ─────────────────────────────────────────────────────────────── */
function useTimer(running) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return { seconds, formatted, reset: () => setSeconds(0) };
}

/* ── Circular progress (SVG) ────────────────────────────────────────────────── */
function CircleProgress({ pct, size = 120, strokeWidth = 10 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

/* ── Selector button helper ─────────────────────────────────────────────────── */
const selBtn = (active) =>
  `rounded-2xl border-2 py-2.5 text-sm font-semibold transition-all ${
    active
      ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200'
      : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
  }`;

/* ═══════════════════════════════════════════════════════════════════════════════
   SETUP SCREEN
══════════════════════════════════════════════════════════════════════════════ */
function SetupScreen({ onStart }) {
  const [syllabuses, setSyllabuses] = useState([]);
  const [classes,    setClasses]    = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [chapters,   setChapters]   = useState([]);

  const [selSyllabus,  setSelSyllabus]  = useState(null);
  const [selClass,     setSelClass]     = useState(null);
  const [selSubject,   setSelSubject]   = useState(null);
  const [selChapters,  setSelChapters]  = useState([]); // array of chapter objects
  const [numQ,         setNumQ]         = useState(10);

  const [loading, setLoading] = useState({ syl: true, cls: false, sub: false, ch: false });

  useEffect(() => {
    getSyllabuses()
      .then((r) => setSyllabuses(r.data.data))
      .catch(console.error)
      .finally(() => setLoading((p) => ({ ...p, syl: false })));
  }, []);

  const pickSyllabus = async (s) => {
    setSelSyllabus(s); setSelClass(null); setSelSubject(null); setSelChapters([]);
    setClasses([]); setSubjects([]); setChapters([]);
    setLoading((p) => ({ ...p, cls: true }));
    try { const r = await getClasses(s._id); setClasses(r.data.data); }
    catch (e) { console.error(e); }
    finally { setLoading((p) => ({ ...p, cls: false })); }
  };

  const pickClass = async (c) => {
    setSelClass(c); setSelSubject(null); setSelChapters([]);
    setSubjects([]); setChapters([]);
    setLoading((p) => ({ ...p, sub: true }));
    try { const r = await getSubjects(selSyllabus._id, c._id); setSubjects(r.data.data); }
    catch (e) { console.error(e); }
    finally { setLoading((p) => ({ ...p, sub: false })); }
  };

  const pickSubject = async (s) => {
    setSelSubject(s); setSelChapters([]); setChapters([]);
    setLoading((p) => ({ ...p, ch: true }));
    try { const r = await getChapters(selSyllabus._id, selClass._id, s._id); setChapters(r.data.data); }
    catch (e) { console.error(e); }
    finally { setLoading((p) => ({ ...p, ch: false })); }
  };

  const toggleChapter = (ch) => {
    setSelChapters((prev) => {
      const has = prev.find((c) => c._id === ch._id);
      if (has) return prev.filter((c) => c._id !== ch._id);
      if (prev.length >= MAX_CHAPTERS) return prev; // cap at 4
      return [...prev, ch];
    });
  };

  const canStart = selSyllabus && selClass && selSubject && selChapters.length >= 1;
  const totalChunks = selChapters.reduce((s, c) => s + (c.totalChunks || 0), 0);
  const effectiveMax = Math.min(MAX_Q, Math.max(MIN_Q, totalChunks * 2));

  const handleStart = () => {
    if (!canStart) return;
    const capped = Math.min(numQ, effectiveMax);
    onStart({
      syllabusId:   selSyllabus._id,
      classLevelId: selClass._id,
      subjectId:    selSubject._id,
      chapterIds:   selChapters.map((c) => c._id),
      numQuestions: capped,
      meta: {
        syllabusName:   selSyllabus.name,
        className:      selClass.name,
        subjectName:    selSubject.name,
        chapterTitles:  selChapters.map((c) => `Ch. ${c.chapterNumber}: ${c.title}`),
        chapterNumbers: selChapters.map((c) => c.chapterNumber),
      },
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="grad-primary px-6 pb-8 pt-10 text-white safe-top">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-3xl bg-white/20">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h1 className="mt-3 text-2xl font-bold">Chapter Quiz</h1>
        <p className="mt-1 text-sm text-indigo-200">Test your knowledge, track your progress</p>
      </div>

      {/* Scrollable setup */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative -mt-4 flex flex-col gap-5 rounded-t-3xl bg-gray-50 px-5 pt-6 pb-8">

          {/* Syllabus */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Syllabus</p>
            {loading.syl ? <div className="h-12 animate-pulse rounded-2xl bg-gray-200" /> : (
              <div className="grid grid-cols-3 gap-2">
                {syllabuses.map((s) => (
                  <button key={s._id} onClick={() => pickSyllabus(s)} className={selBtn(selSyllabus?._id === s._id)}>
                    {s.code || s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Class */}
          {selSyllabus && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Class</p>
              {loading.cls ? <div className="h-12 animate-pulse rounded-2xl bg-gray-200" /> : (
                <div className="grid grid-cols-4 gap-2">
                  {classes.map((c) => (
                    <button key={c._id} onClick={() => pickClass(c)} className={selBtn(selClass?._id === c._id)}>
                      {c.grade || c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subject */}
          {selClass && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Subject</p>
              {loading.sub ? <div className="h-12 animate-pulse rounded-2xl bg-gray-200" /> : (
                <div className="grid grid-cols-2 gap-2">
                  {subjects.map((s) => (
                    <button key={s._id} onClick={() => pickSubject(s)} className={selBtn(selSubject?._id === s._id)}>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chapters */}
          {selSubject && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Chapters <span className="ml-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-indigo-600">{selChapters.length}/{MAX_CHAPTERS}</span>
                </p>
                {selChapters.length >= MAX_CHAPTERS && (
                  <p className="text-[10px] text-amber-600 font-medium">Max {MAX_CHAPTERS} chapters</p>
                )}
              </div>
              {loading.ch ? <div className="h-20 animate-pulse rounded-2xl bg-gray-200" /> : chapters.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-400">
                  No chapters uploaded yet for this subject
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {chapters.map((ch) => {
                    const isSelected = !!selChapters.find((c) => c._id === ch._id);
                    const isDisabled = !isSelected && selChapters.length >= MAX_CHAPTERS;
                    return (
                      <button
                        key={ch._id}
                        onClick={() => !isDisabled && toggleChapter(ch)}
                        className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                          isSelected  ? 'border-indigo-600 bg-indigo-50'
                          : isDisabled ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 bg-white hover:border-indigo-200'
                        }`}
                      >
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                          isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'
                        }`}>
                          {isSelected && <CheckIcon />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
                            Ch. {ch.chapterNumber}: {ch.title}
                          </p>
                          <p className="text-xs text-gray-400">{ch.totalChunks || 0} sections</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Number of questions */}
          {selChapters.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Number of Questions</p>
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                <button
                  onClick={() => setNumQ((q) => Math.max(MIN_Q, q - 5))}
                  disabled={numQ <= MIN_Q}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-xl font-bold text-gray-600 disabled:opacity-30 active:scale-95 transition-all"
                >
                  −
                </button>
                <div className="text-center">
                  <p className="text-4xl font-bold text-indigo-600">{Math.min(numQ, effectiveMax)}</p>
                  <p className="mt-0.5 text-xs text-gray-400">questions</p>
                </div>
                <button
                  onClick={() => setNumQ((q) => Math.min(effectiveMax, q + 5))}
                  disabled={numQ >= effectiveMax}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-xl font-bold text-gray-600 disabled:opacity-30 active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-gray-400">
                Min {MIN_Q} · Max {effectiveMax} questions
                {totalChunks > 0 && ` (${totalChunks} sections selected)`}
              </p>
            </div>
          )}

          {/* Start button */}
          <button
            disabled={!canStart}
            onClick={handleStart}
            className={`w-full rounded-3xl py-4 text-base font-bold transition-all ${
              canStart
                ? 'grad-primary text-white shadow-lg shadow-indigo-200 active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canStart ? `Generate ${Math.min(numQ, effectiveMax)} Questions →` : 'Select chapters to continue'}
          </button>

        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   GENERATING SCREEN
══════════════════════════════════════════════════════════════════════════════ */
function GeneratingScreen({ meta }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-40" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
          <SpinnerIcon className="h-10 w-10" />
        </div>
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">Generating your quiz…</p>
        <p className="mt-1 text-sm text-gray-500">
          Creating questions from {meta?.chapterTitles?.length} chapter{meta?.chapterTitles?.length > 1 ? 's' : ''}
        </p>
      </div>
      {meta?.chapterTitles && (
        <div className="w-full rounded-2xl bg-indigo-50 px-4 py-3 text-left">
          <p className="mb-1 text-xs font-semibold text-indigo-600">Selected chapters:</p>
          {meta.chapterTitles.map((t, i) => (
            <p key={i} className="text-xs text-indigo-700">• {t}</p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   QUIZ TAKING SCREEN
══════════════════════════════════════════════════════════════════════════════ */
function QuizTakingScreen({ questions, meta, onFinish }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected,   setSelected]   = useState(null);
  const [revealed,   setRevealed]   = useState(false);
  const [userAnswers, setUserAnswers] = useState([]); // accumulated answers
  const { seconds, formatted } = useTimer(true);
  const contentRef = useRef(null);

  const q = questions[currentIdx];
  const progress = ((currentIdx) / questions.length) * 100;
  const optionLabels = ['A', 'B', 'C', 'D'];

  const handleSelect = (i) => {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    if (i === q.correct) playCorrect();
    else                 playWrong();
  };

  const handleNext = () => {
    const answer = {
      question:    q.question,
      options:     q.options,
      correct:     q.correct,
      selected,
      isCorrect:   selected === q.correct,
      explanation: q.explanation,
      difficulty:  q.difficulty || 'medium',
      topic:       q.topic || 'General',
    };
    const newAnswers = [...userAnswers, answer];

    if (currentIdx < questions.length - 1) {
      setUserAnswers(newAnswers);
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      playComplete();
      onFinish({ answers: newAnswers, timeTakenSeconds: seconds, meta });
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Progress header */}
      <div className="grad-primary px-4 pb-4 pt-10 safe-top">
        <div className="flex items-center justify-between text-white mb-2">
          <span className="text-sm font-bold">Q {currentIdx + 1} / {questions.length}</span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-mono font-semibold">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatted}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-indigo-200 truncate">{meta?.subjectName} · {q.topic || ''}</p>
      </div>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto bg-gray-50 px-3 py-4">
        {/* Question */}
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              q.difficulty === 'hard' ? 'bg-red-100 text-red-600'
              : q.difficulty === 'easy' ? 'bg-green-100 text-green-600'
              : 'bg-amber-100 text-amber-600'
            }`}>
              {q.difficulty || 'medium'}
            </span>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-gray-900">{q.question}</p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const isCorrect  = i === q.correct;
            const isSelected = i === selected;
            let cls = 'border-gray-200 bg-white text-gray-700';
            if (revealed) {
              if (isCorrect)            cls = 'border-green-500 bg-green-50 text-green-800';
              else if (isSelected)      cls = 'border-red-400 bg-red-50 text-red-700';
            } else if (isSelected) {
              cls = 'border-indigo-500 bg-indigo-50 text-indigo-800';
            }
            return (
              <button key={i} onClick={() => handleSelect(i)}
                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition-all active:scale-[0.98] ${cls}`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  revealed && isCorrect  ? 'bg-green-500 text-white'
                  : revealed && isSelected ? 'bg-red-400 text-white'
                  : 'bg-gray-100 text-gray-600'
                }`}>
                  {revealed && isCorrect ? '✓' : revealed && isSelected ? '✗' : optionLabels[i]}
                </span>
                <span className="flex-1 leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {revealed && (
          <div className={`mt-3 rounded-2xl border px-4 py-3 ${
            selected === q.correct
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }`}>
            <p className={`text-xs font-bold mb-0.5 ${selected === q.correct ? 'text-green-700' : 'text-red-700'}`}>
              {selected === q.correct ? '✅ Correct!' : `❌ Incorrect — Correct answer: ${q.options[q.correct]}`}
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">{q.explanation}</p>
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* Next button */}
      {revealed && (
        <div className="safe-bottom border-t border-gray-100 bg-white px-4 py-3">
          <button onClick={handleNext}
            className="grad-primary w-full rounded-3xl py-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 active:scale-95">
            {currentIdx < questions.length - 1 ? 'Next Question →' : 'See Results →'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   RESULTS SCREEN
══════════════════════════════════════════════════════════════════════════════ */
function ResultsScreen({ result, meta, onRetry, onNewQuiz }) {
  const { score, percentage, weakTopics, strongTopics, timeTakenSeconds } = result;
  const total = meta?.numQuestions || (score + (result.answers?.length - score));

  const grade =
    percentage >= 80 ? { label: 'Excellent!', emoji: '🏆', color: 'text-green-600'  }
    : percentage >= 60 ? { label: 'Good Job!',   emoji: '👍', color: 'text-blue-600'   }
    : percentage >= 40 ? { label: 'Keep Going!', emoji: '💪', color: 'text-amber-600'  }
    :                    { label: 'Study More',  emoji: '📚', color: 'text-red-600'    };

  const mins = Math.floor(timeTakenSeconds / 60);
  const secs = timeTakenSeconds % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="grad-primary px-6 pb-10 pt-12 text-white safe-top text-center">
        <p className="text-4xl mb-2">{grade.emoji}</p>
        <h2 className="text-xl font-bold">{grade.label}</h2>
        <p className="mt-1 text-sm text-indigo-200">{meta?.subjectName} · {meta?.chapterTitles?.join(', ')}</p>
      </div>

      <div className="relative -mt-6 flex flex-col gap-4 rounded-t-3xl bg-gray-50 px-5 pt-6 pb-8">

        {/* Score card */}
        <div className="flex items-center gap-6 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="relative flex items-center justify-center">
            <CircleProgress pct={percentage} size={100} strokeWidth={9} />
            <div className="absolute text-center">
              <p className="text-xl font-bold text-gray-900">{percentage}%</p>
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{score}<span className="text-lg font-normal text-gray-400">/{total}</span></p>
            <p className="text-sm text-gray-500">Correct answers</p>
            <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Time: {timeStr}
            </p>
          </div>
        </div>

        {/* Topics */}
        {(strongTopics?.length > 0 || weakTopics?.length > 0) && (
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 space-y-3">
            <p className="text-sm font-bold text-gray-900">Topic Analysis</p>

            {strongTopics?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold text-green-600">✅ Strong topics</p>
                <div className="flex flex-wrap gap-1.5">
                  {strongTopics.map((t, i) => (
                    <span key={i} className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {weakTopics?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold text-red-500">⚠️ Needs practice</p>
                <div className="flex flex-wrap gap-1.5">
                  {weakTopics.map((t, i) => (
                    <span key={i} className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chapters */}
        {meta?.chapterTitles?.length > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Chapters covered</p>
            {meta.chapterTitles.map((t, i) => (
              <p key={i} className="text-xs text-gray-600 py-0.5">• {t}</p>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button onClick={onRetry}
            className="flex-1 rounded-2xl border-2 border-indigo-600 py-3.5 text-sm font-bold text-indigo-600 active:scale-95 transition-all">
            Try Again
          </button>
          <button onClick={onNewQuiz}
            className="flex-1 grad-primary rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 active:scale-95 transition-all">
            New Quiz
          </button>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN QUIZ PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function QuizPage() {
  const [phase,     setPhase]     = useState('setup');   // setup | generating | taking | results
  const [config,    setConfig]    = useState(null);       // setup payload
  const [quizData,  setQuizData]  = useState(null);       // { questions, meta }
  const [result,    setResult]    = useState(null);       // final result
  const [error,     setError]     = useState(null);

  const handleStart = async (cfg) => {
    setConfig(cfg);
    setPhase('generating');
    setError(null);
    try {
      const res = await generateQuiz(cfg);
      setQuizData(res.data.data);
      setPhase('taking');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate quiz. Please try again.');
      setPhase('setup');
    }
  };

  const handleFinish = useCallback(async ({ answers, timeTakenSeconds, meta }) => {
    const score      = answers.filter((a) => a.isCorrect).length;
    const percentage = Math.round((score / answers.length) * 100);

    // Optimistically show results
    const optimistic = { score, percentage, timeTakenSeconds,
      weakTopics: [], strongTopics: [], answers };
    setResult({ ...optimistic, meta: { ...quizData.meta, numQuestions: answers.length } });
    setPhase('results');

    // Save to backend in background
    try {
      const res = await submitQuiz({
        syllabusId:      config.syllabusId,
        classLevelId:    config.classLevelId,
        subjectId:       config.subjectId,
        chapterIds:      config.chapterIds,
        answers,
        timeTakenSeconds,
        meta:            quizData.meta,
      });
      // Update with server analysis (weak/strong topics)
      const srv = res.data.data;
      setResult((prev) => ({ ...prev, weakTopics: srv.weakTopics, strongTopics: srv.strongTopics }));
    } catch (e) {
      console.error('Failed to save quiz result:', e.message);
    }
  }, [config, quizData]);

  const handleRetry = () => {
    setPhase('generating');
    setError(null);
    handleStart(config);
  };

  const handleNewQuiz = () => {
    setPhase('setup');
    setConfig(null);
    setQuizData(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {error && (
        <div className="mx-4 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-semibold underline">Dismiss</button>
        </div>
      )}

      {phase === 'setup'      && <SetupScreen     onStart={handleStart} />}
      {phase === 'generating' && <GeneratingScreen meta={config?.meta}  />}
      {phase === 'taking'     && quizData && (
        <QuizTakingScreen
          questions={quizData.questions}
          meta={quizData.meta}
          onFinish={handleFinish}
        />
      )}
      {phase === 'results' && result && (
        <ResultsScreen
          result={result}
          meta={result.meta}
          onRetry={handleRetry}
          onNewQuiz={handleNewQuiz}
        />
      )}
    </div>
  );
}
