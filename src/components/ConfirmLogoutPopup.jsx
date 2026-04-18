export default function ConfirmLogoutPopup({
  message = "Bạn có muốn xoá không?",
  onOk,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        aria-label="Close"
        onClick={onCancel}
      />

      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Confirm"
      >
        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700" aria-hidden>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86l-7.2 12.47A2 2 0 004.82 19h14.36a2 2 0 001.73-2.67l-7.2-12.47a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">Xác nhận</h2>
              <p className="mt-1 text-sm text-slate-600">{message}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
          <button
            type="button"
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500"
            onClick={onOk}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

