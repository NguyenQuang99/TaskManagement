import { useState } from "react";

export const START_PAGE_STORAGE_KEY = "management-employee.startPage";

const START_PAGE_OPTIONS = ["Kanban", "Profile", "Login"];

const LABEL_TO_PATH = {
  Kanban: "/kanban",
  Profile: "/profile",
  Login: "/",
};

function readStoredStartPageLabel() {
  try {
    const raw = localStorage.getItem(START_PAGE_STORAGE_KEY);
    if (raw && START_PAGE_OPTIONS.includes(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "Kanban";
}

/** Đường dẫn tương ứng lựa chọn đã lưu (mặc định Kanban nếu chưa có). */
export function getSavedStartPath() {
  const label = readStoredStartPageLabel();
  return LABEL_TO_PATH[label] ?? "/kanban";
}

export default function StartPage() {
  const [startPageDropdownOpen, setStartPageDropdownOpen] = useState(false);
  const [startPageLabel, setStartPageLabel] = useState(readStoredStartPageLabel);

  return (
    <div className="overflow-visible rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Set start page</h2>
        <p className="mt-1 text-sm text-slate-500">Choose which page should open first.</p>
      </div>
      <div className="p-5">
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setStartPageDropdownOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-expanded={startPageDropdownOpen}
            aria-controls="start-page-options"
          >
            <span>Set start page</span>
            <span className="text-xs text-slate-500">{startPageLabel}</span>
            <span className={`text-cyan-600 transition-transform ${startPageDropdownOpen ? "rotate-180" : ""}`}>⌄</span>
          </button>

          {startPageDropdownOpen ? (
            <div
              id="start-page-options"
              className="absolute left-0 z-20 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
              role="menu"
              aria-label="Start page options"
            >
              {START_PAGE_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setStartPageLabel(item);
                    setStartPageDropdownOpen(false);
                    try {
                      localStorage.setItem(START_PAGE_STORAGE_KEY, item);
                    } catch {
                      /* ignore */
                    }
                  }}
                  className={`block w-full rounded-md px-3 py-2 text-left text-sm transition ${
                    startPageLabel === item
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                  role="menuitem"
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
