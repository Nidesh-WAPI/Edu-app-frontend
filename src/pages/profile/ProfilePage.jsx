import useAuth from '@/hooks/useAuth';

const menuItems = [
  { icon: '🎓', label: 'My Progress', sub: 'Coming soon' },
  { icon: '🔔', label: 'Notifications', sub: 'Manage alerts' },
  { icon: '🌐', label: 'Language', sub: 'English' },
  { icon: '❓', label: 'Help & Support', sub: 'FAQ & contact' },
];

export default function ProfilePage() {
  const { customer, logout } = useAuth();

  const initial = (customer?.name?.[0] || customer?.phone?.[0] || 'S').toUpperCase();
  const displayName = customer?.name || 'Student';
  const displayPhone = customer?.phone ? `+91 ${customer.phone}` : '';

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="grad-primary px-6 pb-10 pt-10 text-white safe-top">
        <h1 className="text-xl font-bold">Profile</h1>
      </div>

      {/* Avatar card */}
      <div className="mx-5 -mt-6 rounded-3xl bg-white p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl grad-primary text-2xl font-bold text-white shadow-md shadow-indigo-200">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-lg font-bold text-gray-900">{displayName}</h2>
            {displayPhone && (
              <p className="text-sm text-gray-500">{displayPhone}</p>
            )}
            <span className="mt-1 inline-block rounded-xl bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              Student
            </span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="mx-5 mt-4 rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {menuItems.map((item, i) => (
          <button
            key={i}
            className={`flex w-full items-center gap-4 px-5 py-4 text-left active:bg-gray-50 ${
              i !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400">{item.sub}</p>
            </div>
            <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* App info */}
      <div className="mx-5 mt-4 rounded-3xl bg-indigo-50 px-5 py-4">
        <p className="text-xs font-semibold text-indigo-700">EduApp — AI Textbook</p>
        <p className="text-xs text-indigo-400 mt-0.5">Version 1.0.0 · Student Edition</p>
      </div>

      {/* Logout */}
      <div className="mx-5 mt-4 mb-8">
        <button
          onClick={logout}
          className="w-full rounded-3xl border-2 border-red-100 bg-red-50 py-4 text-sm font-bold text-red-500 active:bg-red-100 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
