/**
 * SideNav — Left sidebar navigation for tablet and larger screens.
 *
 * Hidden on mobile (< md) — BottomNav is used instead.
 *
 * Breakpoints:
 *   md  (768px+)  : 64px wide  — icons only
 *   xl  (1280px+) : 224px wide — icons + labels
 *   2xl (1536px+) : 256px wide — icons + labels (slightly more spacious)
 */

import { NavLink } from 'react-router-dom';

const tabs = [
  {
    to: '/home',
    label: 'Home',
    icon: (active) => (
      <svg className={`h-5 w-5 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/ai-textbook',
    label: 'AI Tutor',
    icon: (active) => (
      <svg className={`h-5 w-5 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    to: '/quiz',
    label: 'Quiz',
    icon: (active) => (
      <svg className={`h-5 w-5 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    to: '/unit-test',
    label: 'Tests',
    icon: (active) => (
      <svg className={`h-5 w-5 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (active) => (
      <svg className={`h-5 w-5 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function SideNav() {
  return (
    <aside className="
      hidden md:flex
      fixed left-0 top-0 h-screen z-40
      flex-col
      bg-white border-r border-gray-100
      w-16 xl:w-56 2xl:w-64
      transition-all duration-200
    ">
      {/* Brand */}
      <div className="flex h-16 flex-shrink-0 items-center justify-center xl:justify-start xl:px-5 border-b border-gray-100">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600">
          <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="hidden xl:block ml-3 overflow-hidden">
          <p className="text-sm font-bold text-gray-900 leading-tight">EduApp</p>
          <p className="text-[10px] text-gray-400 font-medium leading-tight">Student Edition</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to}>
            {({ isActive }) => (
              <div className={`
                flex items-center gap-3
                rounded-xl px-3 py-2.5
                transition-all duration-150
                cursor-pointer
                ${isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }
              `}>
                {tab.icon(isActive)}
                <span className={`hidden xl:block text-sm font-semibold truncate ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="hidden xl:block ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-100 px-2 py-3">
        <div className="flex items-center justify-center xl:justify-start gap-3 px-3 py-2">
          <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="hidden xl:block text-xs font-medium text-gray-500 truncate">My Account</p>
        </div>
      </div>
    </aside>
  );
}
