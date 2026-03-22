import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getSyllabuses, getClasses, getSubjects } from '@/api/config.api';
import { sendChatMessage, requestDeepDive } from '@/api/ai.api';

/* ─────────────────────────────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────────────────────────────── */
const SendIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);
const BackIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const BotIcon = ({ className = 'h-5 w-5 text-indigo-600' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="h-5 w-5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
   TOPIC EXTRACTION — detect numbered / bulleted list items in markdown
───────────────────────────────────────────────────────────────────────────── */
const extractTopics = (text) => {
  const seen = new Set();
  const topics = [];

  const patterns = [
    /^\d+\.\s+\*\*([^*\n]{3,60})\*\*/gm,       // 1. **Topic Name**
    /^\d+\.\s+([A-Z][^\n:—–-]{3,55})$/gm,       // 1. Topic Name (plain, starts capital)
    /^#{2,3}\s+(?!#+)([^\n]{3,60})$/gm,          // ## Heading
    /^[-*]\s+\*\*([^*\n]{3,60})\*\*/gm,          // - **Topic**
  ];

  for (const pattern of patterns) {
    for (const m of text.matchAll(pattern)) {
      const topic = m[1].trim().replace(/[*_`#]/g, '').trim();
      if (topic.length > 2 && topic.length < 65 && !seen.has(topic.toLowerCase())) {
        seen.add(topic.toLowerCase());
        topics.push(topic);
      }
    }
  }
  return topics;
};

/* ─────────────────────────────────────────────────────────────────────────────
   MARKDOWN COMPONENTS — rich rendering with table + heading support
───────────────────────────────────────────────────────────────────────────── */
const mkComponents = {
  h1: ({ children }) => <h1 className="mb-2 mt-3 text-base font-bold text-gray-900 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-1.5 mt-3 text-sm font-bold text-gray-800 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1 mt-2 text-sm font-semibold text-indigo-700 first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 space-y-1 pl-1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 space-y-1 pl-4 list-decimal">{children}</ol>,
  li: ({ children }) => (
    <li className="flex gap-2 text-gray-700">
      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-mono text-indigo-700">{children}</code>
    ) : (
      <code className="block overflow-x-auto rounded-xl bg-gray-800 p-3 text-xs font-mono text-green-300">{children}</code>
    ),
  pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded-xl bg-gray-800 p-3">{children}</pre>,
  hr: () => <hr className="my-3 border-gray-200" />,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-4 border-indigo-300 bg-indigo-50 py-1 pl-3 text-sm italic text-indigo-800">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-2 w-full overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full min-w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-indigo-600 text-white">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-100 bg-white">{children}</tbody>,
  tr: ({ children }) => <tr className="even:bg-indigo-50/40">{children}</tr>,
  th: ({ children }) => <th className="px-3 py-2.5 text-left text-xs font-semibold tracking-wide">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 text-left text-xs text-gray-700 leading-relaxed">{children}</td>,
};

/* ─────────────────────────────────────────────────────────────────────────────
   TYPING DOTS
───────────────────────────────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-end gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-2 w-2 rounded-full bg-indigo-400"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TOPIC CARDS — shown below AI messages with multiple topics
───────────────────────────────────────────────────────────────────────────── */
function TopicCards({ topics, onSelect }) {
  if (!topics || topics.length < 3) return null;
  return (
    <div className="mx-3 mt-2 mb-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
        <span>🎯</span> Tap a topic to dive deeper
      </p>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, i) => (
          <button
            key={i}
            onClick={() => onSelect(topic)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 shadow-sm active:scale-95 transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
          >
            <span className="text-[10px] font-bold text-indigo-400">#{i + 1}</span>
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CHAT BUBBLE
───────────────────────────────────────────────────────────────────────────── */
function ChatBubble({ message, onTopicSelect }) {
  const isUser = message.role === 'user';
  const topics = !isUser ? extractTopics(message.content) : [];

  return (
    <div>
      <div className={`flex items-end gap-2 px-3 py-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUser && (
          <div className="mb-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-100">
            <BotIcon />
          </div>
        )}
        <div className={`text-sm shadow-sm ${
          isUser
            ? 'max-w-[78%] rounded-3xl rounded-br-sm bg-indigo-600 px-4 py-3 text-white'
            : 'w-full rounded-3xl rounded-bl-sm border border-gray-100 bg-white px-4 py-3 text-gray-800'
        }`}>
          {isUser ? (
            <p className="leading-relaxed">{message.content}</p>
          ) : (
            <div>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mkComponents}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          <p className={`mt-1.5 text-right text-[10px] ${isUser ? 'text-indigo-200' : 'text-gray-400'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Topic explorer cards */}
      {topics.length >= 3 && (
        <TopicCards topics={topics} onSelect={onTopicSelect} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STEP INDICATOR
───────────────────────────────────────────────────────────────────────────── */
const STEPS = [
  { key: 'explain',  icon: '📖', label: 'Understand'  },
  { key: 'examples', icon: '💡', label: 'Examples'    },
  { key: 'quiz',     icon: '🧠', label: 'Quiz'        },
  { key: 'next',     icon: '🔗', label: 'Explore'     },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-1 px-4 py-2">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition-all ${
            i < current  ? 'bg-indigo-600 text-white'
            : i === current ? 'bg-indigo-100 ring-2 ring-indigo-600 text-indigo-700 font-bold'
            : 'bg-gray-100 text-gray-400'
          }`}>
            {i < current ? '✓' : s.icon}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`mx-1 h-0.5 w-6 rounded ${i < current ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUIZ COMPONENT
───────────────────────────────────────────────────────────────────────────── */
function QuizComponent({ questions, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[current];

  const handleSelect = (i) => {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    if (i === q.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setDone(true);
    }
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-6 text-center">
        <div className="text-5xl">{pct >= 67 ? '🎉' : pct >= 34 ? '👍' : '📚'}</div>
        <div>
          <p className="text-xl font-bold text-gray-900">{score}/{questions.length} Correct</p>
          <p className="mt-1 text-sm text-gray-500">
            {pct >= 67 ? 'Great job! You understood this topic well.' : 'Keep practising — you\'ll get there!'}
          </p>
        </div>
        <div className="h-3 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${pct >= 67 ? 'bg-green-500' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <button
          onClick={onComplete}
          className="grad-primary w-full max-w-xs rounded-3xl py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 active:scale-95"
        >
          🔗 What should I learn next?
        </button>
      </div>
    );
  }

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-indigo-600">
          Question {current + 1} of {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${
              i < current ? 'bg-green-400' : i === current ? 'bg-indigo-600' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>

      <p className="text-sm font-semibold leading-relaxed text-gray-900">{q.question}</p>

      <div className="flex flex-col gap-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct;
          const isSelected = i === selected;
          let cls = 'border-gray-200 bg-white text-gray-700';
          if (answered) {
            if (isCorrect) cls = 'border-green-500 bg-green-50 text-green-800';
            else if (isSelected) cls = 'border-red-400 bg-red-50 text-red-700';
          } else if (isSelected) {
            cls = 'border-indigo-500 bg-indigo-50 text-indigo-800';
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ${cls}`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                answered && isCorrect ? 'bg-green-500 text-white'
                : answered && isSelected ? 'bg-red-400 text-white'
                : 'bg-gray-100 text-gray-600'
              }`}>
                {answered && isCorrect ? '✓' : answered && isSelected ? '✗' : optionLabels[i]}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
          <p className="text-xs font-semibold text-indigo-700">
            {selected === q.correct ? '✅ Correct!' : `❌ The correct answer is: ${q.options[q.correct]}`}
          </p>
          <p className="mt-1 text-xs text-indigo-600">{q.explanation}</p>
        </div>
      )}

      {answered && (
        <button
          onClick={handleNext}
          className="grad-primary w-full rounded-3xl py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-200 active:scale-95"
        >
          {current < questions.length - 1 ? 'Next Question →' : 'See My Score →'}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DEEP DIVE SCREEN — 4-step guided learning
───────────────────────────────────────────────────────────────────────────── */
function DeepDiveScreen({ topic, syllabus, classLevel, subject, onBack, onTopicSelect }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [content, setContent] = useState({ explain: null, examples: null, quiz: null, next: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const currentStep = STEPS[stepIndex];

  // Auto-load first step on mount
  useEffect(() => { loadStep('explain'); }, []); // eslint-disable-line

  const loadStep = async (step) => {
    if (content[step]) return; // already loaded
    setLoading(true);
    setError(null);
    try {
      const res = await requestDeepDive({
        syllabusId: syllabus._id,
        classLevelId: classLevel._id,
        subjectId: subject._id,
        topic,
        step,
      });
      const data = res.data.data;
      setContent((prev) => ({
        ...prev,
        [step]: step === 'quiz' ? data.questions : data.reply,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToStep = async (i) => {
    setStepIndex(i);
    await loadStep(STEPS[i].key);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const handleNextStep = () => {
    if (stepIndex < STEPS.length - 1) goToStep(stepIndex + 1);
  };

  const nextBtnLabels = ['💡 See Examples', '🧠 Test Myself', '🔗 What\'s Next?'];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="grad-primary px-4 pb-3 pt-10 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 text-white">
            <BackIcon />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-200">Deep Dive</p>
            <h2 className="truncate text-base font-bold text-white">{topic}</h2>
          </div>
        </div>
        {/* Step indicator */}
        <div className="mt-3 flex items-center justify-center gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => content[s.key] || i <= stepIndex ? goToStep(i) : null}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                i === stepIndex
                  ? 'bg-white text-indigo-700 shadow font-bold'
                  : i < stepIndex
                  ? 'bg-white/30 text-white'
                  : 'bg-white/10 text-indigo-300'
              }`}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50">
        {/* Step title card */}
        <div className="mx-3 mt-3 mb-2 rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentStep.icon}</span>
            <div>
              <p className="text-base font-bold text-gray-900">{currentStep.label}</p>
              <p className="text-xs text-gray-500">
                {currentStep.key === 'explain'  && `Understanding ${topic}`}
                {currentStep.key === 'examples' && `Real-world examples of ${topic}`}
                {currentStep.key === 'quiz'     && `Test your knowledge of ${topic}`}
                {currentStep.key === 'next'     && `Topics to explore after ${topic}`}
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-indigo-500">
            <SpinnerIcon />
            <p className="text-sm text-gray-500">
              {currentStep.key === 'quiz' ? 'Preparing your quiz...' : 'Loading...'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mx-3 mt-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => loadStep(currentStep.key)}
              className="mt-3 rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white">
              Try Again
            </button>
          </div>
        )}

        {/* Content — Explain / Examples / Next (markdown) */}
        {!loading && !error && content[currentStep.key] && currentStep.key !== 'quiz' && (
          <div className="mx-3 mt-1 mb-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm text-sm text-gray-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mkComponents}>
              {content[currentStep.key]}
            </ReactMarkdown>

            {/* "Explore More" topics — clickable */}
            {currentStep.key === 'next' && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="mb-2 text-xs font-semibold text-indigo-600">Tap a topic to start a new deep dive:</p>
                <div className="flex flex-wrap gap-2">
                  {extractTopics(content.next || '').map((t, i) => (
                    <button key={i} onClick={() => onTopicSelect(t)}
                      className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all active:scale-95">
                      {t} →
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content — Quiz */}
        {!loading && !error && content.quiz && currentStep.key === 'quiz' && (
          <div className="mx-3 mt-1 mb-3 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <QuizComponent
              questions={content.quiz}
              onComplete={handleNextStep}
            />
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* Footer action — next step button (not on quiz, quiz has its own) */}
      {!loading && !error && content[currentStep.key] && currentStep.key !== 'quiz' && stepIndex < STEPS.length - 1 && (
        <div className="safe-bottom border-t border-gray-100 bg-white px-4 py-3">
          <button
            onClick={handleNextStep}
            className="grad-primary w-full rounded-3xl py-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 active:scale-95"
          >
            {nextBtnLabels[stepIndex]}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CHAT SCREEN
───────────────────────────────────────────────────────────────────────────── */
function ChatScreen({ syllabus, classLevel, subject, onBack }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi! 👋 I'm your AI tutor for **${subject.name}**.\n\nI can help you understand concepts, explain topics, solve doubts, and give examples — all from your ${syllabus.name} ${classLevel.name} textbook.\n\nWhat would you like to learn today?`,
    timestamp: Date.now(),
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deepDiveTopic, setDeepDiveTopic] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage({
        syllabusId: syllabus._id, classLevelId: classLevel._id, subjectId: subject._id,
        message: text, history,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.data.reply, timestamp: Date.now() }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err.response?.data?.message || 'Something went wrong. Please try again.'}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, messages, syllabus, classLevel, subject]);

  // If a topic is selected → show deep dive
  if (deepDiveTopic) {
    return (
      <DeepDiveScreen
        topic={deepDiveTopic}
        syllabus={syllabus}
        classLevel={classLevel}
        subject={subject}
        onBack={() => setDeepDiveTopic(null)}
        onTopicSelect={(t) => setDeepDiveTopic(t)}
      />
    );
  }

  const suggestions = [
    'Give me a summary of this subject',
    'List the main topics I should know',
    'Give me 5 practice questions',
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="grad-primary px-4 pb-4 pt-10 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 text-white">
            <BackIcon />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-base font-bold text-white">{subject.name}</h2>
            <p className="text-xs text-indigo-200">{syllabus.name} · {classLevel.name}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20">
            <BotIcon className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 py-3">
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} message={msg} onTopicSelect={(t) => setDeepDiveTopic(t)} />
        ))}

        {isLoading && (
          <div className="flex items-end gap-2 px-3 py-1">
            <div className="mb-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-100">
              <BotIcon />
            </div>
            <div className="rounded-3xl rounded-bl-sm border border-gray-100 bg-white shadow-sm">
              <TypingDots />
            </div>
          </div>
        )}

        {messages.length === 1 && !isLoading && (
          <div className="mt-3 flex flex-col gap-2 px-3">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="rounded-2xl border border-indigo-200 bg-white px-4 py-2.5 text-left text-sm text-indigo-700 shadow-sm active:bg-indigo-50">
                💡 {s}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="safe-bottom border-t border-gray-100 bg-white px-3 py-3">
        <div className="flex items-end gap-2 rounded-3xl border border-gray-200 bg-gray-50 px-4 py-2 focus-within:border-indigo-400 focus-within:bg-white transition-colors">
          <textarea ref={inputRef} value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask a question from your textbook..."
            rows={1} className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            style={{ maxHeight: '80px' }}
            onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'; }}
          />
          <button onClick={handleSend} disabled={!input.trim() || isLoading}
            className={`mb-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl transition-all ${
              input.trim() && !isLoading ? 'grad-primary text-white shadow-md active:scale-95' : 'bg-gray-200 text-gray-400'
            }`}>
            <SendIcon />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-gray-400">Answers are based on your textbook content</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUBJECT SELECTOR
───────────────────────────────────────────────────────────────────────────── */
function SubjectSelector({ onStart }) {
  const [syllabuses, setSyllabuses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState({ syllabuses: true, classes: false, subjects: false });

  useEffect(() => {
    getSyllabuses()
      .then((r) => setSyllabuses(r.data.data))
      .catch(console.error)
      .finally(() => setLoading((p) => ({ ...p, syllabuses: false })));
  }, []);

  const handleSyllabusChange = async (syl) => {
    setSelectedSyllabus(syl); setSelectedClass(null); setSelectedSubject(null);
    setClasses([]); setSubjects([]);
    if (!syl) return;
    setLoading((p) => ({ ...p, classes: true }));
    try { const r = await getClasses(syl._id); setClasses(r.data.data); }
    catch (e) { console.error(e); }
    finally { setLoading((p) => ({ ...p, classes: false })); }
  };

  const handleClassChange = async (cls) => {
    setSelectedClass(cls); setSelectedSubject(null); setSubjects([]);
    if (!cls) return;
    setLoading((p) => ({ ...p, subjects: true }));
    try { const r = await getSubjects(selectedSyllabus._id, cls._id); setSubjects(r.data.data); }
    catch (e) { console.error(e); }
    finally { setLoading((p) => ({ ...p, subjects: false })); }
  };

  const canStart = selectedSyllabus && selectedClass && selectedSubject;
  const selBtn = (active) =>
    `rounded-2xl border-2 py-3 text-sm font-semibold transition-all ${
      active ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200'
             : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'}`;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="grad-primary px-6 pb-8 pt-10 text-white safe-top">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-3xl bg-white/20">
          <BotIcon className="h-7 w-7 text-white" />
        </div>
        <h1 className="mt-3 text-2xl font-bold">AI Tutor</h1>
        <p className="mt-1 text-sm text-indigo-200">Ask anything from your textbook</p>
      </div>

      <div className="relative -mt-4 flex flex-1 flex-col gap-4 rounded-t-3xl bg-gray-50 px-5 pt-6 pb-8">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Syllabus</p>
          {loading.syllabuses ? <div className="h-12 rounded-2xl bg-gray-200 animate-pulse" /> : (
            <div className="grid grid-cols-3 gap-2">
              {syllabuses.map((s) => (
                <button key={s._id} onClick={() => handleSyllabusChange(s)} className={selBtn(selectedSyllabus?._id === s._id)}>
                  {s.code || s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedSyllabus && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Class</p>
            {loading.classes ? <div className="h-12 rounded-2xl bg-gray-200 animate-pulse" /> : (
              <div className="grid grid-cols-4 gap-2">
                {classes.map((c) => (
                  <button key={c._id} onClick={() => handleClassChange(c)} className={selBtn(selectedClass?._id === c._id)}>
                    {c.grade || c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedClass && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Subject</p>
            {loading.subjects ? <div className="h-12 rounded-2xl bg-gray-200 animate-pulse" /> : (
              <div className="grid grid-cols-2 gap-2">
                {subjects.map((s) => (
                  <button key={s._id} onClick={() => setSelectedSubject(s)} className={selBtn(selectedSubject?._id === s._id)}>
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-auto pt-4">
          <button
            disabled={!canStart}
            onClick={() => onStart({ syllabus: selectedSyllabus, classLevel: selectedClass, subject: selectedSubject })}
            className={`w-full rounded-3xl py-4 text-base font-bold transition-all ${
              canStart ? 'grad-primary text-white shadow-lg shadow-indigo-200 active:scale-95'
                       : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Start Learning →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function AITextbookPage() {
  const [selection, setSelection] = useState(null);
  if (selection) return <ChatScreen {...selection} onBack={() => setSelection(null)} />;
  return <SubjectSelector onStart={setSelection} />;
}
