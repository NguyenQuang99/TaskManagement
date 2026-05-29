import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { closestCorners, DndContext, DragOverlay, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "../components/TaskCard";
import Column from "../components/Column";
import Layout from "../components/Layout";
import { auth } from "../services/firebase.js";
import TaskModal from "../components/TaskModal/TaskModal.jsx";
import CustomFiltersPanel, { ASSIGNEE_CHIP_KEY_UNASSIGNED } from "../components/CustomFiltersPanel.jsx";
import { useAllUsers } from "../hooks/useAllUsers.js";
import {
  COLUMN_KEYS,
  COLUMN_TO_FIREBASE,
  columnDroppableId,
  emptyZoneDroppableId,
  getTaskDndId,
  useKanbanDnD,
} from "../hooks/useKanbanDnD.js";
import { useTaskSearch } from "../hooks/useTaskSearch.js";
import {
  kanbanInitialLoadQueryKeyRoot,
  useKanbanTasks,
} from "../hooks/useKanbanTasks.js";
import { useCreateTaskMutation, useUpdateTaskMutation } from "../hooks/useTaskMutations.js";

function parseAssigneeKeysFromSearchParams(searchParams) {
  return (searchParams.get("assignees") ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

const AVATAR_COLORS = [
  "bg-gradient-to-br from-sky-500 to-blue-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
  "bg-gradient-to-br from-pink-500 to-rose-600",
  "bg-gradient-to-br from-indigo-500 to-violet-600",
  "bg-gradient-to-br from-orange-500 to-rose-600",
];

function getAssigneeUser(task, users) {
  const uid = task?.userId;
  if (!uid || !Array.isArray(users)) return null;
  return users.find((x) => x && typeof x === "object" && x.id === uid) ?? null;
}

function getAssigneeAvatarUrl(task, users) {
  const u = getAssigneeUser(task, users);
  const url = u?.avatar;
  return typeof url === "string" && url.trim() !== "" ? url.trim() : "";
}

function getInitials(task, users) {
  const u = users ? getAssigneeUser(task, users) : null;
  const fromProfile = u?.FullName || u?.UserName || u?.Email;
  const source =
    fromProfile ||
    task.assigneeName ||
    task.assignee ||
    task.userName ||
    task.user ||
    task.owner ||
    "";
  if (!source) return "?";
  return source
    .toString()
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function SortableTaskItem({ id, task, avatarClass, onTaskClick, users }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab touch-none active:cursor-grabbing"
    >
      <div
        role="button"
        tabIndex={0}
        className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 rounded-lg"
        onClick={() => onTaskClick?.(task)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTaskClick?.(task);
          }
        }}
      >
        <TaskCard
          title={task.title ?? task.name ?? "Untitled task"}
          description={task.description ?? task.desc ?? "No description"}
          initials={getInitials(task, users)}
          avatarClass={avatarClass}
          avatarUrl={getAssigneeAvatarUrl(task, users)}
        />
      </div>
    </div>
  );
}

function ColumnEmptyState({ columnKey, variant = "default" }) {
  const { setNodeRef, isOver } = useDroppable({ id: emptyZoneDroppableId(columnKey) });
  const isFiltered = variant === "filtered";
  const message = isFiltered ? "No tasks match filters" : "No tasks yet.";

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border border-dashed p-3 text-xs transition ${
        isOver
          ? "border-indigo-400 bg-white/70 text-indigo-600"
          : isFiltered
            ? "border-amber-200 bg-amber-50/80 text-amber-800"
            : "border-slate-300 bg-white/70 text-slate-500"
      }`}
    >
      {message}
    </div>
  );
}

const KANBAN_COLUMN_SKELETON_ROWS = {
  todo: 3,
  inProgress: 4,
  review: 4,
  done: 5,
};

function KanbanColumnSkeleton({ rows = 4 }) {
  return (
    <div className="flex flex-col gap-2.5" role="status" aria-live="polite" aria-label="Loading tasks">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-slate-200/80 bg-white/90 p-3 shadow-sm"
        >
          <div className="h-3.5 w-3/4 rounded bg-slate-200" />
          <div className="mt-2 h-2.5 w-full rounded bg-slate-100" />
          <div className="mt-1.5 h-2.5 w-5/6 rounded bg-slate-100" />
          <div className="mt-3 flex items-center gap-2">
            <div className="h-6 w-6 shrink-0 rounded-full bg-slate-200" />
            <div className="h-2 w-14 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function renderTaskList(tasks, columnKey, onTaskClick, users, emptyVariant = "default") {
  const ids = tasks.map((task, index) => getTaskDndId(task, columnKey, index));
  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      {tasks.length === 0 ? (
        <ColumnEmptyState columnKey={columnKey} variant={emptyVariant} />
      ) : (
        tasks.map((task, index) => {
          const id = getTaskDndId(task, columnKey, index);
          return (
            <SortableTaskItem
              key={id}
              id={id}
              task={task}
              avatarClass={AVATAR_COLORS[index % AVATAR_COLORS.length]}
              onTaskClick={onTaskClick}
              users={users}
            />
          );
        })
      )}
    </SortableContext>
  );
}

function renderColumnBody(
  tasks,
  columnKey,
  onTaskClick,
  users,
  kanbanInitialPending,
  emptyVariant = "default"
) {
  if (kanbanInitialPending) {
    return (
      <KanbanColumnSkeleton rows={KANBAN_COLUMN_SKELETON_ROWS[columnKey] ?? 4} />
    );
  }
  return renderTaskList(tasks, columnKey, onTaskClick, users, emptyVariant);
}

export default function KanbanBoard() {
  const queryClient = useQueryClient();
  const {
    tasksByColumn,
    setTasksByColumn,
    columnPagination,
    loadingMoreByColumn,
    loadMoreColumn,
    refreshBoardTasks,
    retryKanbanInitialLoad,
    kanbanInitialPending,
    kanbanInitialRetrying,
    kanbanInitialLoadFailed,
  } = useKanbanTasks();
  const [searchParams, setSearchParams] = useSearchParams();
  const [taskModal, setTaskModal] = useState(null);
  const assigneeKeysFromSearchParams = useMemo(
    () => parseAssigneeKeysFromSearchParams(searchParams),
    [searchParams]
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );
  const { users } = useAllUsers();
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const syncKanbanTaskQueries = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: kanbanInitialLoadQueryKeyRoot, type: "active" });
  }, [queryClient]);

  const toggleAssigneeFilterChip = useCallback((key) => {
    const currentKeys = parseAssigneeKeysFromSearchParams(searchParams);
    const nextKeys = currentKeys.includes(key)
      ? currentKeys.filter((k) => k !== key)
      : [...currentKeys, key];

    const nextParams = new URLSearchParams(searchParams);
    if (nextKeys.length > 0) nextParams.set("assignees", nextKeys.join(","));
    else nextParams.delete("assignees");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const removeAssigneeFilterChip = useCallback((key) => {
    const currentKeys = parseAssigneeKeysFromSearchParams(searchParams);
    const nextKeys = currentKeys.filter((k) => k !== key);

    const nextParams = new URLSearchParams(searchParams);
    if (nextKeys.length > 0) nextParams.set("assignees", nextKeys.join(","));
    else nextParams.delete("assignees");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const { setNodeRef: setTodoDropRef } = useDroppable({ id: columnDroppableId("todo") });
  const { setNodeRef: setInProgressDropRef } = useDroppable({ id: columnDroppableId("inProgress") });
  const { setNodeRef: setReviewDropRef } = useDroppable({ id: columnDroppableId("review") });
  const { setNodeRef: setDoneDropRef } = useDroppable({ id: columnDroppableId("done") });

  const {
    activeId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    findTaskById,
  } = useKanbanDnD(
    tasksByColumn,
    setTasksByColumn,
    refreshBoardTasks,
    syncKanbanTaskQueries
  );

  const { filteredTasksByColumn, queryNormalized } = useTaskSearch(tasksByColumn);

  const selectedAssigneeKeys = useMemo(
    () => new Set(assigneeKeysFromSearchParams),
    [assigneeKeysFromSearchParams]
  );

  const knownUserIds = useMemo(() => new Set(users.map((u) => u.id).filter(Boolean)), [users]);

  const userNameById = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      const label = (u?.UserName || u?.FullName || u?.Email || u?.id || "").toString().trim();
      if (u?.id && label) map.set(u.id, label);
    });
    return map;
  }, [users]);

  const assigneeFilterChips = useMemo(
    () =>
      assigneeKeysFromSearchParams.map((key) => ({
        key,
        label:
          key === ASSIGNEE_CHIP_KEY_UNASSIGNED ? "Unassigned" : userNameById.get(key) ?? key,
      })),
    [assigneeKeysFromSearchParams, userNameById]
  );

  const displayTasksByColumn = useMemo(() => {
    if (selectedAssigneeKeys.size === 0) return filteredTasksByColumn;

    const includeUnassigned = selectedAssigneeKeys.has(ASSIGNEE_CHIP_KEY_UNASSIGNED);
    const out = {};

    COLUMN_KEYS.forEach((columnKey) => {
      out[columnKey] = (filteredTasksByColumn[columnKey] ?? []).filter((task) => {
        const rawUserId = typeof task?.userId === "string" ? task.userId.trim() : "";
        const hasKnownAssignee = Boolean(rawUserId) && knownUserIds.has(rawUserId);

        if (hasKnownAssignee) return selectedAssigneeKeys.has(rawUserId);
        return includeUnassigned;
      });
    });

    return out;
  }, [filteredTasksByColumn, knownUserIds, selectedAssigneeKeys]);

  const counts = useMemo(
    () => ({
      todo: displayTasksByColumn.todo.length,
      inProgress: displayTasksByColumn.inProgress.length,
      review: displayTasksByColumn.review.length,
      done: displayTasksByColumn.done.length,
    }),
    [displayTasksByColumn]
  );

  const columnTaskCount = (count) => (kanbanInitialPending ? "—" : count);

  const hasActiveFilters =
    queryNormalized.length > 0 || selectedAssigneeKeys.size > 0;

  const getColumnEmptyVariant = useCallback(
    (columnKey) => {
      if (kanbanInitialPending || kanbanInitialLoadFailed) return "default";
      const displayLen = displayTasksByColumn[columnKey]?.length ?? 0;
      if (displayLen > 0) return "default";
      const sourceLen = tasksByColumn[columnKey]?.length ?? 0;
      if (hasActiveFilters && sourceLen > 0) return "filtered";
      return "default";
    },
    [
      displayTasksByColumn,
      hasActiveFilters,
      kanbanInitialLoadFailed,
      kanbanInitialPending,
      tasksByColumn,
    ]
  );

  const handleKanbanLoadRetry = useCallback(async () => {
    try {
      await retryKanbanInitialLoad();
    } catch (err) {
      console.error("Kanban initial load retry failed:", err);
    }
  }, [retryKanbanInitialLoad]);

  const activeTask = activeId ? findTaskById(activeId) : null;

  const onCreateTask = async ({ title, description, assignee }) => {
    const trimmedTitle = (title ?? "").trim();
    if (!trimmedTitle) {
      window.alert("Please enter a title.");
      return;
    }

    let userId = (assignee ?? "").trim();
    if (userId === "me") userId = auth.currentUser?.uid ?? "";
    if (!userId) {
      window.alert("Please assign the task to a user.");
      return;
    }

    const columnKey = "todo";
    const order = String(tasksByColumn[columnKey].length);

    try {
      await createTaskMutation.mutateAsync({
        columnId: COLUMN_TO_FIREBASE.todo,
        title: trimmedTitle,
        description: (description ?? "").trim(),
        userId,
        order,
        status: "todo",
      });
      setTaskModal(null);
      await syncKanbanTaskQueries();
    } catch {
      window.alert("Could not create task. Please try again.");
    }
  };

  const onUpdateTask = async (taskId, { title, description, assignee }) => {
    const trimmedTitle = (title ?? "").trim();
    if (!trimmedTitle) {
      window.alert("Please enter a title.");
      return;
    }

    let userId = (assignee ?? "").trim();
    if (userId === "me") userId = auth.currentUser?.uid ?? "";

    if (!userId) {
      window.alert("Please assign the task to a user.");
      return;
    }

    try {
      await updateTaskMutation.mutateAsync({
        taskId,
        payload: {
          title: trimmedTitle,
          description: (description ?? "").trim(),
          userId,
        },
      });
      setTaskModal(null);
      await syncKanbanTaskQueries();
    } catch {
      window.alert("Could not save task. Please try again.");
    }
  };

  const handleOpenTaskForEdit = (task) => {
    if (!task?.id) return;
    setTaskModal({ mode: "edit", task });
  };

  const filtersHidden = searchParams.get("hideFilters") === "1";

  return (
    <Layout>
      <div className="flex h-full min-h-0 flex-col bg-slate-50">
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <h1 className="text-lg font-semibold text-slate-900">Task Management</h1>
          <p className="mt-0.5 text-sm text-slate-500">All User Task Board</p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 pt-6 sm:flex-row sm:items-stretch sm:gap-4">
          {!filtersHidden ? (
            <div className="shrink-0 self-start">
              <CustomFiltersPanel
                tasksByColumn={tasksByColumn}
                kanbanInitialPending={kanbanInitialPending}
                kanbanInitialLoadFailed={kanbanInitialLoadFailed}
                assigneeChips={assigneeFilterChips}
                onToggleAssigneeChip={toggleAssigneeFilterChip}
                onRemoveAssigneeChip={removeAssigneeFilterChip}
              />
            </div>
          ) : null}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            {kanbanInitialLoadFailed ? (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                <p className="font-medium">Could not load the task board. Please try again.</p>
                <button
                  type="button"
                  onClick={handleKanbanLoadRetry}
                  disabled={kanbanInitialRetrying}
                  className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {kanbanInitialRetrying ? "Retrying…" : "Retry"}
                </button>
              </div>
            ) : null}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-4">
              <Column
              title="Todo"
              taskCount={columnTaskCount(counts.todo)}
              columnBgClass="bg-[#3b82f6]/15"
              headerTextClass="text-slate-800"
              badgeBgClass="bg-[#3b82f6]/20"
              badgeTextClass="text-slate-700"
              onAddTask={() => setTaskModal({ mode: "create" })}
              droppableRef={setTodoDropRef}
              lazyLoadEnabled
              hasMoreTasks={columnPagination.todo.hasMore}
              loadingMoreTasks={loadingMoreByColumn.todo}
              onLoadMoreTasks={() => loadMoreColumn("todo")}
            >
              {renderColumnBody(
                displayTasksByColumn.todo,
                "todo",
                handleOpenTaskForEdit,
                users,
                kanbanInitialPending,
                getColumnEmptyVariant("todo")
              )}
            </Column>

              <Column
              title="In Progress"
              taskCount={columnTaskCount(counts.inProgress)}
              columnBgClass="bg-[#22c55e]/15"
              headerTextClass="text-slate-800"
              badgeBgClass="bg-[#22c55e]/20"
              badgeTextClass="text-slate-700"
              droppableRef={setInProgressDropRef}
              lazyLoadEnabled
              hasMoreTasks={columnPagination.inProgress.hasMore}
              loadingMoreTasks={loadingMoreByColumn.inProgress}
              onLoadMoreTasks={() => loadMoreColumn("inProgress")}
            >
              {renderColumnBody(
                displayTasksByColumn.inProgress,
                "inProgress",
                handleOpenTaskForEdit,
                users,
                kanbanInitialPending,
                getColumnEmptyVariant("inProgress")
              )}
            </Column>

              <Column
              title="Review"
              taskCount={columnTaskCount(counts.review)}
              columnBgClass="bg-[#cfd350]"
              headerTextClass="text-slate-900"
              badgeBgClass="bg-[#cfd350]/80"
              badgeTextClass="text-slate-900"
              droppableRef={setReviewDropRef}
              lazyLoadEnabled
              hasMoreTasks={columnPagination.review.hasMore}
              loadingMoreTasks={loadingMoreByColumn.review}
              onLoadMoreTasks={() => loadMoreColumn("review")}
            >
              {renderColumnBody(
                displayTasksByColumn.review,
                "review",
                handleOpenTaskForEdit,
                users,
                kanbanInitialPending,
                getColumnEmptyVariant("review")
              )}
            </Column>

              <Column
              title="Done"
              taskCount={columnTaskCount(counts.done)}
              columnBgClass="bg-[#70728f]"
              headerTextClass="text-white"
              badgeBgClass="bg-[#70728f]/80"
              badgeTextClass="text-white"
              droppableRef={setDoneDropRef}
              lazyLoadEnabled
              hasMoreTasks={columnPagination.done.hasMore}
              loadingMoreTasks={loadingMoreByColumn.done}
              onLoadMoreTasks={() => loadMoreColumn("done")}
            >
              {renderColumnBody(
                displayTasksByColumn.done,
                "done",
                handleOpenTaskForEdit,
                users,
                kanbanInitialPending,
                getColumnEmptyVariant("done")
              )}
              </Column>
            </div>
            <DragOverlay>
              {activeTask ? (
                <div className="w-[280px] max-w-sm">
                  <TaskCard
                    title={activeTask.title ?? activeTask.name ?? "Untitled task"}
                    description={activeTask.description ?? activeTask.desc ?? "No description"}
                    initials={getInitials(activeTask, users)}
                    avatarClass={AVATAR_COLORS[0]}
                    avatarUrl={getAssigneeAvatarUrl(activeTask, users)}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          </div>
        </div>
      </div>
      {taskModal ? (
        <TaskModal
          mode={taskModal.mode}
          task={taskModal.mode === "edit" ? taskModal.task : null}
          users={users}
          onCancel={() => setTaskModal(null)}
          onDeleteSuccess={async () => {
            await syncKanbanTaskQueries();
          }}
          onSave={
            taskModal.mode === "edit" && taskModal.task?.id
              ? (payload) => onUpdateTask(taskModal.task.id, payload)
              : onCreateTask
          }
        />
      ) : null}
    </Layout>

  );
}
