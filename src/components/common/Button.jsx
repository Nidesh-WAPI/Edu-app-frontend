export default function Button({ children, loading, className = '', variant = 'primary', ...props }) {
  const base = 'relative flex w-full items-center justify-center rounded-2xl py-3.5 text-base font-semibold transition-all active:scale-95 disabled:cursor-not-allowed';
  const variants = {
    primary: 'grad-primary text-white shadow-lg shadow-indigo-500/30 disabled:opacity-60',
    ghost: 'text-indigo-600 hover:bg-indigo-50',
    outline: 'border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  );
}
