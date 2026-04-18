import UserMenuPopup from "./UserMenuPopup.jsx"
import { useCallback } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useSearchQueryParam } from "../hooks/useSearchQueryParam.js";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile.js";

function SlidersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 21V10M4 6V3M12 21v-5M12 13V3M20 21v-9M20 8V3M9 10h6M7 3H5m14 0h-2M17 16h-2"
      />
    </svg>
  );
}

export default function Header() {
  const { user, loading } = useCurrentUserProfile();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isKanbanPage = location.pathname === "/kanban";
  const [query, setQuery] = useSearchQueryParam("q");

  const filtersHidden = searchParams.get("hideFilters") === "1";
  const assigneeFilterCount = (searchParams.get("assignees") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean).length;

  const toggleFiltersPanel = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    if (filtersHidden) next.delete("hideFilters");
    else next.set("hideFilters", "1");
    setSearchParams(next, { replace: true });
  }, [filtersHidden, searchParams, setSearchParams]);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {isKanbanPage ? (
          <button
            type="button"
            onClick={toggleFiltersPanel}
            aria-expanded={!filtersHidden}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-cyan-600 transition hover:bg-slate-200"
          >
            <SlidersIcon className="h-4 w-4 shrink-0" />
            <span>{filtersHidden ? "Show filters" : "Hide filters"}</span>
            {assigneeFilterCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold leading-none text-white">
                {assigneeFilterCount}
              </span>
            ) : null}
          </button>
        ) : null}
        <div className="relative max-w-[350px] min-w-0 flex-1">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={!isKanbanPage}
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>
      <div className="group relative">
        <button type="button" className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-white">
          {loading ? (
            <span className="flex h-full w-full items-center justify-center bg-slate-200 text-[10px] text-slate-500">
              …
            </span>
          ) : user?.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-slate-200 text-xs font-semibold text-slate-600">
              {(user?.FullName || user?.UserName || user?.Email || "?")
                .toString()
                .trim()
                .charAt(0)
                .toUpperCase() || "?"}
            </span>
          )}
        </button>

        <div className="hidden group-hover:block">
          <UserMenuPopup />
        </div>
      </div>
    </header>
  )
}
