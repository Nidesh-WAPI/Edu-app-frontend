/**
 * AppShell — wraps the entire app.
 *
 * On mobile  : full-screen, edge-to-edge
 * On desktop : phone-sized frame (390 × 844px) centered on a gradient bg
 */
export default function AppShell({ children }) {
  return (
    <>
      {/* Desktop: gradient bg + phone frame */}
      <div className="hidden min-h-screen items-center justify-center grad-primary sm:flex">
        <div className="app-frame">{children}</div>
      </div>

      {/* Mobile: full screen */}
      <div className="flex min-h-screen flex-col bg-white sm:hidden">
        {children}
      </div>
    </>
  );
}
