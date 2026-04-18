import { Link } from "react-router-dom"
export default function Sidebar() {
  return (
    <aside
      className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-200"
      aria-label="Main navigation"
    >
      <div className="flex h-16 items-center border-b border-slate-800 px-5">
        <span className="text-lg font-semibold tracking-tight text-white">Task Management</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Sidebar menu">

        <Link
          to="/kanban"
          className="rounded-lg bg-slate-800/80 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Dashboard
        </Link>
        <Link
          to="/profile"
          className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800/60 hover:text-white"
        >
          Settings
        </Link>
      </nav>
    </aside>
  )
}
