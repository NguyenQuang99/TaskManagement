import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

const DEFAULT_ASSIGNEE_USERS = [
  "QuangNM",
  "TatsujiNakayama",
  "Hiroshi Wada",
  "Teppei Miyashita",
  "taku washio",
]

function initialsFromName(name) {
  const s = typeof name === "string" ? name.trim() : ""
  if (!s) return "?"
  const parts = s.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return s.slice(0, 2).toUpperCase()
}

/** Chuẩn hoá phần tử `users`: string (legacy) hoặc object Firestore `{ id, FullName, UserName, Email, avatar }`. */
function normalizeAssigneeUsers(users) {
  return (users ?? []).map((u) => {
    if (typeof u === "string") {
      return { key: u, value: u, label: u, avatarUrl: "" }
    }
    const label =
      [u.FullName, u.UserName, u.Email].find(
        (x) => typeof x === "string" && x.trim() !== ""
      ) ?? u.id ?? "?"
    const avatarUrl =
      typeof u.avatar === "string" && u.avatar.trim() !== "" ? u.avatar.trim() : ""
    return { key: u.id ?? label, value: u.id ?? label, label, avatarUrl }
  })
}

const AVATAR_GRADIENTS = [
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
]

export default function AssignUser({
  users = DEFAULT_ASSIGNEE_USERS,
  onAssigneeChange,
  inputName = "assignee",
  initialAssignee = "",
}) {
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignSearch, setAssignSearch] = useState("")
  const [selectedAssignee, setSelectedAssignee] = useState(initialAssignee)
  const assignRef = useRef(null)
  const popoverRef = useRef(null)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 384 })

  const normalizedUsers = useMemo(() => normalizeAssigneeUsers(users), [users])

  const listUsers = useMemo(() => {
    const q = assignSearch.trim().toLowerCase()
    if (!q) return normalizedUsers
    return normalizedUsers.filter((u) => u.label.toLowerCase().includes(q))
  }, [normalizedUsers, assignSearch])

  const selectedLabel = useMemo(() => {
    if (!selectedAssignee) return ""
    if (selectedAssignee === "me") return "Me"
    const found = normalizedUsers.find((u) => u.value === selectedAssignee)
    return found?.label ?? selectedAssignee
  }, [selectedAssignee, normalizedUsers])

  const commitSelection = (value) => {
    setSelectedAssignee(value)
    setAssignOpen(false)
    setAssignSearch("")
    onAssigneeChange?.(value)
  }

  useLayoutEffect(() => {
    if (!assignOpen) return
    const update = () => {
      const el = assignRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setPopoverPos({
        top: r.bottom + 8,
        left: r.left,
        width: Math.min(384, Math.max(r.width, 280)),
      })
    }
    update()
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
    }
  }, [assignOpen])

  useEffect(() => {
    if (!assignOpen) return
    const handlePointerDown = (e) => {
      const t = e.target
      if (assignRef.current?.contains(t) || popoverRef.current?.contains(t)) return
      setAssignOpen(false)
    }
    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [assignOpen])

  return (
    <div className="space-y-2 sm:col-span-2">
      <span className="text-sm font-medium text-slate-700">User assignment</span>

      <input type="hidden" name={inputName} value={selectedAssignee} />

      <div ref={assignRef}>
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-200"
            aria-hidden
          >
            <svg className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6L12 2z" />
            </svg>
          </div>
          <div className="flex flex-wrap items-baseline gap-1 text-sm">
            <button
              type="button"
              onClick={() => setAssignOpen((o) => !o)}
              className="border-b border-dotted border-indigo-600 font-medium text-indigo-600 hover:text-indigo-500"
            >
              Assign
            </button>
            <span className="text-slate-600">or</span>
            <button
              type="button"
              onClick={() => commitSelection("me")}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Assign to me
            </button>
          </div>
        </div>

        {selectedAssignee ? (
          <p className="mt-1 text-xs text-slate-500">
            Selected:{" "}
            <span className="font-medium text-slate-700">{selectedLabel}</span>
          </p>
        ) : null}
      </div>

      {assignOpen
        ? createPortal(
            <div
              ref={popoverRef}
              className="fixed z-[200] rounded-lg border border-slate-200 bg-white shadow-lg"
              style={{
                top: popoverPos.top,
                left: popoverPos.left,
                width: popoverPos.width,
              }}
              role="listbox"
              aria-label="Search users"
            >
              <div
                className="absolute -top-1.5 left-6 h-3 w-3 rotate-45 border-l border-t border-slate-200 bg-white"
                aria-hidden
              />

              <div className="relative p-3 pt-4">
                <input
                  type="search"
                  placeholder="Search for users"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  className="h-10 w-full rounded-md border border-sky-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  autoFocus
                />

                <ul className="mt-2 max-h-52 overflow-y-auto py-1">
                  {listUsers.map((entry, i) => (
                    <li key={entry.key}>
                      <button
                        type="button"
                        onClick={() => commitSelection(entry.value)}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm text-slate-800 transition hover:bg-slate-50"
                      >
                        {entry.avatarUrl ? (
                          <img
                            src={entry.avatarUrl}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]}`}
                          >
                            {initialsFromName(entry.label)}
                          </span>
                        )}
                        <span className="truncate font-medium">{entry.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-slate-200 pt-2 text-center">
                  <p className="text-xs font-medium text-cyan-700">
                    ...too many users, keep filtering
                  </p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
