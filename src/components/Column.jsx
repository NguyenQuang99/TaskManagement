import { useEffect, useRef, useState } from "react";

export default function Column({
  title,
  taskCount,
  children,
  columnBgClass,
  headerTextClass,
  badgeBgClass,
  badgeTextClass,
  onAddTask,
  droppableRef,
  /** Bật lazy load: khi cuộn gần đáy gọi `onLoadMoreTasks` */
  lazyLoadEnabled = false,
  hasMoreTasks = false,
  loadingMoreTasks = false,
  onLoadMoreTasks,
}) {
  const [sortDir, setSortDir] = useState("asc");
  const scrollRootRef = useRef(null);
  const sentinelRef = useRef(null);
  const onLoadMoreRef = useRef(onLoadMoreTasks);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMoreTasks;
  }, [onLoadMoreTasks]);

  useEffect(() => {
    if (!lazyLoadEnabled || !hasMoreTasks || loadingMoreTasks) return;
    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) onLoadMoreRef.current?.();
      },
      { root, rootMargin: "80px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [lazyLoadEnabled, hasMoreTasks, loadingMoreTasks]);

  return (
    <section
      ref={droppableRef}
      className={`flex min-h-0 min-w-[280px] max-w-sm flex-1 flex-col rounded-xl border border-slate-200/80 ${columnBgClass ?? "bg-slate-100/80"} sm:min-w-0 sm:max-w-none`}
    >
      <div className="flex items-center justify-between border-b border-slate-200/90 px-3 py-3">
        <h2 className={`text-xs font-bold uppercase tracking-wide ${headerTextClass ?? "text-slate-700"}`}>
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white/60 text-slate-600 transition hover:bg-white hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            aria-label={`Sort ${title} ${sortDir === "asc" ? "ascending" : "descending"}`}
            title={sortDir === "asc" ? "Sort ascending" : "Sort descending"}
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              {sortDir === "asc" ? (
                <path d="M10 4l-5 6h10l-5-6z" />
              ) : (
                <path d="M10 16l5-6H5l5 6z" />
              )}
            </svg>
          </button>

          <span
            className={`rounded-md ${badgeBgClass ?? "bg-slate-200/80"} px-2 py-0.5 text-[11px] font-semibold ${badgeTextClass ?? "text-slate-600"}`}
          >
            {taskCount}
          </span>
        </div>
      </div>

      <div
        ref={scrollRootRef}
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3"
      >
        {children}
        {lazyLoadEnabled && hasMoreTasks ? (
          <div className="flex shrink-0 flex-col items-center gap-2 py-2">
            <div ref={sentinelRef} className="h-px w-full" aria-hidden />
            {loadingMoreTasks ? (
              <div
                className="flex items-center gap-2 text-xs font-medium text-slate-500"
                role="status"
                aria-live="polite"
              >
                <svg
                  className="h-4 w-4 animate-spin text-indigo-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Loading…</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {title === "Todo" ? (
        <div className="border-t border-slate-200/90 p-2">
          <button
            type="button"
            onClick={() => {
              if (typeof onAddTask === "function") onAddTask();
            }}
            className="w-full rounded-lg border border-dashed border-slate-300 bg-white/60 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-white hover:text-slate-900"
          >
            + Add Task
          </button>
        </div>
      ) : null}
    </section>
  );
}