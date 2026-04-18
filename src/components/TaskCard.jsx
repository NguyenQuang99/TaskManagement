export default function TaskCard({ title, description, initials, avatarClass, avatarUrl }) {
  return (
    <article className="cursor-default rounded-lg border border-slate-200 bg-white p-3 shadow-sm ring-1 ring-slate-900/5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{description}</p>
      <div className="mt-3 flex justify-end">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-7 w-7 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-slate-900/10"
          />
        ) : (
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${avatarClass}`}
            aria-hidden
          >
            {initials}
          </div>
        )}
      </div>
    </article>
  );
}