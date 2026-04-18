export default function MenuSetting({ activeLabel = "User settings", onSelectPage }) {
  const SETTINGS_ITEMS = [
    { label: "User settings" },
    { label: "Change password" },
    { label: "Set start pages" },
  ]

  return (
    <aside className="lg:col-span-3">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <nav className="p-2" aria-label="Settings navigation">
          <ul className="space-y-1">
            {SETTINGS_ITEMS.map((item) => {
              const active = item.label === activeLabel
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => onSelectPage(item.label)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}