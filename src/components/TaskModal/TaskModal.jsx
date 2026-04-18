import AssignUser from "../AssignUser.jsx"
import {deleteTask} from "../../services/firebase.js"

export default function TaskModal({
  mode = "create",
  users,
  task = null,
  onSave = undefined,
  onCancel = undefined,
  onDeleteSuccess = undefined,
}) {
  const heading = mode === "edit" ? "Edit Task" : "Create Task"
  const formKey = mode === "edit" && task?.id ? task.id : "create"

  const onDelete = async () => {
    if (!task.id) return
    try {
      await deleteTask(task.id)
      await onDeleteSuccess()
      onCancel()
    } catch {
      window.alert("Could not delete task. Please try again.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        aria-label="Close modal"
        onClick={onCancel}
      />

      <div
        className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Task form"
      >
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{heading}</h2>
              <p className="mt-1 text-sm text-slate-500">Fill in the details to save the task.</p>
            </div>

            <button
              type="button"
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
              aria-label="Close"
              onClick={onCancel}
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <form
            key={formKey}
            id="task-modal-form"
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              onSave?.({
                title: String(fd.get("title") ?? ""),
                description: String(fd.get("description") ?? ""),
                assignee: String(fd.get("assignee") ?? ""),
              })
            }}
          >
            <div className="space-y-2">
              <label htmlFor="task-title" className="text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                id="task-title"
                name="title"
                type="text"
                defaultValue={mode === "edit" ? (task?.title ?? "") : ""}
                placeholder="e.g. Update onboarding docs"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="task-description" className="text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="task-description"
                name="description"
                defaultValue={mode === "edit" ? (task?.description ?? "") : ""}
                placeholder="Add details, acceptance criteria, or notes..."
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AssignUser
                users={users}
                initialAssignee={mode === "edit" ? (task?.userId ?? "") : ""}
              />
            </div>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white px-5 py-4">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={onDelete}
              className="h-11 rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50"
              aria-label="Delete task"
            >
              Delete
            </button>
          ) : null}
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="task-modal-form"
              className="h-11 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
