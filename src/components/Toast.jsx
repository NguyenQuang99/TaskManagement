const TOAST_STYLES = {
  success: {
    wrapper: "border-emerald-200 bg-emerald-50 text-emerald-900",
    iconBg: "bg-emerald-500",
    title: "Update successful",
  },
  error: {
    wrapper: "border-rose-200 bg-rose-50 text-rose-900",
    iconBg: "bg-rose-500",
    title: "Update failed",
  },
};

export default function Toast({
  type = "success",
  title,
  message = "",
  actionLabel = "Close",
  onAction,
}) {
  const style = TOAST_STYLES[type] || TOAST_STYLES.success;

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${style.wrapper}`}
      role="status"
      aria-live="polite"
    >
      <span
        className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${style.iconBg}`}
      >
        {type === "error" ? "!" : "✓"}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title || style.title}</p>
        <p className="mt-1 break-words text-sm opacity-90">{message}</p>
      </div>

      <button
        type="button"
        onClick={onAction}
        className="rounded-md px-2 py-1 text-xs font-semibold transition hover:bg-white/50"
      >
        {actionLabel}
      </button>
    </div>
  );
}

