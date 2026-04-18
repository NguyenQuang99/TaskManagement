import { useCallback, useMemo, useState } from "react";
import { useAllUsers } from "../hooks/useAllUsers.js";
import { flattenTasksByColumn } from "../hooks/useKanbanDnD.js";

function displayUserName(user) {
  const un = typeof user?.UserName === "string" ? user.UserName.trim() : "";
  if (un) return un;
  const em = typeof user?.Email === "string" ? user.Email.trim() : "";
  if (em) return em.split("@")[0] || em;
  return user?.id ?? "?";
}

function userAvatarUrl(user) {
  return typeof user?.avatar === "string" && user.avatar.trim() !== "" ? user.avatar.trim() : "";
}

/** Đếm theo `userId` trên danh sách task đã có (vd task đã tải trên board). */
function buildAssigneeCounts(tasks, knownUserIds) {
  const userIdSet = new Set(knownUserIds);
  const byUser = new Map(knownUserIds.map((id) => [id, 0]));
  let unassigned = 0;
  for (const t of tasks) {
    const raw = typeof t.userId === "string" ? t.userId.trim() : "";
    if (raw && userIdSet.has(raw)) {
      byUser.set(raw, (byUser.get(raw) ?? 0) + 1);
    } else {
      unassigned += 1;
    }
  }
  return { byUser, unassigned };
}

export const ASSIGNEE_CHIP_KEY_UNASSIGNED = "__unassigned__";

function AssigneeFilterRow({ name, avatarUrl, count, isUnassigned, onSelect, isSelected }) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() ?? "?";
  const rowClass = `flex w-full items-center justify-between border-b border-slate-200/80 px-3 py-2 text-left last:border-b-0 ${
    onSelect ? "transition hover:bg-slate-100/90" : ""
  } ${isSelected ? "bg-slate-100" : ""}`;

  const inner = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {isUnassigned ? (
          <span
            className="h-5 w-5 shrink-0 rounded-full bg-slate-200 ring-1 ring-slate-300"
            aria-hidden
          />
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-slate-300"
          />
        ) : (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-300">
            {initial}
          </span>
        )}
        <span className="truncate text-[11px] font-semibold text-slate-700">{name}</span>
      </div>
      <span className="shrink-0 bg-[#d7deea] px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums">
        {count}
      </span>
    </>
  );

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={rowClass}>
        {inner}
      </button>
    );
  }

  return <div className={rowClass}>{inner}</div>;
}

const EMPTY_TASKS_BY_COLUMN = {
  todo: [],
  inProgress: [],
  review: [],
  done: [],
};

/**
 * @param {{
 *   tasksByColumn?: Record<string, Array<Record<string, unknown>>>;
 *   kanbanInitialPending?: boolean;
 *   kanbanInitialLoadFailed?: boolean;
 *   assigneeChips?: Array<{ key: string; label: string }>;
 *   onToggleAssigneeChip?: (key: string, label: string) => void;
 *   onRemoveAssigneeChip?: (key: string) => void;
 * }} props — task lấy từ `tasksByColumn` của board (một nguồn với Kanban).
 */
export default function CustomFiltersPanel({
  tasksByColumn = EMPTY_TASKS_BY_COLUMN,
  kanbanInitialPending = false,
  kanbanInitialLoadFailed = false,
  assigneeChips = [],
  onToggleAssigneeChip,
  onRemoveAssigneeChip,
}) {
  const [tagsOpen, setTagsOpen] = useState(false);
  const [assignedToOpen, setAssignedToOpen] = useState(false);
  const [createdByOpen, setCreatedByOpen] = useState(false);
  const toggleAssigneeChip = useCallback((key, label) => {
    onToggleAssigneeChip?.(key, label);
  }, [onToggleAssigneeChip]);

  const removeAssigneeChip = useCallback((key) => {
    onRemoveAssigneeChip?.(key);
  }, [onRemoveAssigneeChip]);

  const { users, loading: usersLoading } = useAllUsers();

  const tasksFlat = useMemo(() => flattenTasksByColumn(tasksByColumn), [tasksByColumn]);

  const knownUserIds = useMemo(() => users.map((u) => u.id).filter(Boolean), [users]);

  const { byUser, unassigned } = useMemo(
    () => buildAssigneeCounts(tasksFlat, knownUserIds),
    [tasksFlat, knownUserIds]
  );

  const usersSorted = useMemo(() => {
    return [...users].sort((a, b) =>
      displayUserName(a).toLowerCase().localeCompare(displayUserName(b).toLowerCase())
    );
  }, [users]);

  const assigneeListLoading = usersLoading || kanbanInitialPending;

  const chevronClass = (open) =>
    `inline-block text-cyan-600 transition-transform duration-200 ${open ? "" : "-rotate-90"}`;

  return (
    <div className="w-[246px] border border-slate-300 bg-white p-2 text-slate-700">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] font-semibold text-slate-700">
          Custom filters ({assigneeChips.length})
        </p>
      </div>

      <div className="mb-2 border border-slate-200 bg-[#eef4e8] p-2">
        <p className="text-[11px] font-semibold text-[#8fb64a]">Filtered by:</p>
        {assigneeChips.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {assigneeChips.map((chip) => (
              <div
                key={chip.key}
                className="inline-flex items-center gap-1.5 border border-slate-300 bg-white px-2 py-1 text-[11px]"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={() => removeAssigneeChip(chip.key)}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label={`Remove ${chip.label}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-1 text-[12px]">
        <div className="border border-slate-200 bg-slate-50">
          <button
            type="button"
            aria-expanded={tagsOpen}
            aria-controls="custom-filters-tags-panel"
            id="custom-filters-tags-heading"
            onClick={() => setTagsOpen((open) => !open)}
            className="flex w-full items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-[12px] text-slate-700"
          >
            <span>Tags</span>
            <span className={chevronClass(tagsOpen)} aria-hidden>
              ⌄
            </span>
          </button>
          {tagsOpen ? (
            <div
              id="custom-filters-tags-panel"
              role="region"
              aria-labelledby="custom-filters-tags-heading"
              className="bg-[#f4f4f6] px-3 py-2 text-[11px] text-slate-500"
            >
              No tags
            </div>
          ) : null}
        </div>

        <div className="border border-slate-200 bg-slate-50">
          <button
            type="button"
            aria-expanded={assignedToOpen}
            aria-controls="custom-filters-assigned-to-panel"
            id="custom-filters-assigned-to-heading"
            onClick={() => setAssignedToOpen((open) => !open)}
            className="flex w-full items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-[12px] text-slate-700"
          >
            <span>Assigned to</span>
            <span className={chevronClass(assignedToOpen)} aria-hidden>
              ⌄
            </span>
          </button>
          {assignedToOpen ? (
            <div
              id="custom-filters-assigned-to-panel"
              role="region"
              aria-labelledby="custom-filters-assigned-to-heading"
              className="max-h-56 overflow-y-auto bg-[#f4f4f6]"
            >
              {assigneeListLoading ? (
                <div className="px-3 py-2 text-[11px] text-slate-500">Loading…</div>
              ) : kanbanInitialLoadFailed ? (
                <div className="px-3 py-2 text-[11px] text-red-600">Could not load tasks for counts.</div>
              ) : (
                <>
                  <AssigneeFilterRow
                    name="Unassigned"
                    avatarUrl=""
                    count={unassigned}
                    isUnassigned
                    onSelect={() =>
                      toggleAssigneeChip(ASSIGNEE_CHIP_KEY_UNASSIGNED, "Unassigned")
                    }
                    isSelected={assigneeChips.some((c) => c.key === ASSIGNEE_CHIP_KEY_UNASSIGNED)}
                  />
                  {usersSorted.map((u) => {
                    const userName = displayUserName(u);
                    return (
                      <AssigneeFilterRow
                        key={u.id}
                        name={userName}
                        avatarUrl={userAvatarUrl(u)}
                        count={byUser.get(u.id) ?? 0}
                        onSelect={() => toggleAssigneeChip(u.id, userName)}
                        isSelected={assigneeChips.some((c) => c.key === u.id)}
                      />
                    );
                  })}
                </>
              )}
            </div>
          ) : null}
        </div>

        <div className="border border-slate-200 bg-slate-50">
          <button
            type="button"
            aria-expanded={createdByOpen}
            aria-controls="custom-filters-created-by-panel"
            id="custom-filters-created-by-heading"
            onClick={() => setCreatedByOpen((open) => !open)}
            className="flex w-full items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-[12px] text-slate-700"
          >
            <span className="text-slate-500">Created by</span>
            <span className={chevronClass(createdByOpen)} aria-hidden>
              ⌄
            </span>
          </button>
          {createdByOpen ? (
            <div
              id="custom-filters-created-by-panel"
              role="region"
              aria-labelledby="custom-filters-created-by-heading"
              className="bg-[#f4f4f6] px-3 py-2 text-[11px] text-slate-500"
            >
              All creators
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
