import useAuth from '@/hooks/useAuth';
import Button from '@/components/common/Button';

export default function HomePage() {
  const { customer, logout } = useAuth();

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="grad-primary px-6 pb-8 pt-12 text-white safe-top">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-indigo-200">Good morning 👋</p>
            <h1 className="mt-0.5 text-2xl font-bold">{customer?.name || `+91 ${customer?.phone?.slice(-10)}` || 'Student'}</h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold text-white backdrop-blur-sm">
            {(customer?.name?.[0] || customer?.phone?.[0] || 'S').toUpperCase()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative -mt-4 flex flex-1 flex-col rounded-t-3xl bg-gray-50 px-5 pt-6">
        {/* Coming soon card */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-100">
            <svg className="h-9 w-9 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-center text-lg font-bold text-gray-900">AI Textbook Coming Soon</h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Ask questions from any chapter, get instant answers, and explore your textbook with AI.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {['CBSE', 'ICSE', 'State Board'].map((s) => (
              <div key={s} className="rounded-2xl bg-indigo-50 p-3 text-center">
                <p className="text-xs font-semibold text-indigo-700">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats placeholder */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: 'Chapters', value: '—', icon: '📚' },
            { label: 'Questions', value: '—', icon: '🤔' },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl bg-white p-4 shadow-sm border border-gray-100">
              <p className="text-2xl">{item.icon}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label} accessed</p>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="mt-auto pb-8 pt-6">
          <Button variant="outline" onClick={logout}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}
