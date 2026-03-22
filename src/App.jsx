import AppRoutes from './routes/AppRoutes';

/**
 * Responsive layout:
 * - Mobile  : full-screen white app
 * - Desktop : phone frame (390px) centered on an indigo gradient bg
 */
export default function App() {
  return (
    <>
      {/* ── Mobile layout (< sm) ── */}
      <div className="flex min-h-screen flex-col bg-white sm:hidden">
        <AppRoutes />
      </div>

      {/* ── Desktop: phone frame centered on gradient ── */}
      <div className="hidden min-h-screen items-center justify-center grad-primary sm:flex">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
        </div>
        {/* Phone frame */}
        <div className="relative app-frame">
          <AppRoutes />
        </div>
        {/* Badge under frame */}
        <p className="absolute bottom-4 text-xs font-medium text-white/50">EduApp · Student Edition</p>
      </div>
    </>
  );
}
