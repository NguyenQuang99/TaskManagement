import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import KanbanBoard from "./KanbanBoard.jsx";

const { MOCK_TASK_TITLE, mockKanbanTasksReturn } = vi.hoisted(() => {
  const MOCK_TASK_TITLE = "Integration smoke task";
  const emptyColumnPagination = { cursor: null, hasMore: false };
  return {
    MOCK_TASK_TITLE,
    mockKanbanTasksReturn: {
      tasksByColumn: {
        todo: [
          {
            id: "task-1",
            title: MOCK_TASK_TITLE,
            description: "Test description",
          },
        ],
        inProgress: [],
        review: [],
        done: [],
      },
      setTasksByColumn: vi.fn(),
      columnPagination: {
        todo: emptyColumnPagination,
        inProgress: emptyColumnPagination,
        review: emptyColumnPagination,
        done: emptyColumnPagination,
      },
      loadingMoreByColumn: {
        todo: false,
        inProgress: false,
        review: false,
        done: false,
      },
      loadMoreColumn: vi.fn(),
      refreshBoardTasks: vi.fn().mockResolvedValue(undefined),
      retryKanbanInitialLoad: vi.fn().mockResolvedValue(undefined),
      kanbanInitialPending: false,
      kanbanInitialRetrying: false,
      kanbanInitialLoadFailed: false,
    },
  };
});

/** App auth session (replaces legacy useFirebaseAuth naming in specs). */
vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn(() => ({
    user: { uid: "test-user", email: "test@example.com" },
    ready: true,
    uid: "test-user",
    isAuthenticated: true,
  })),
}));

vi.mock("../hooks/useKanbanTasks.js", () => ({
  useKanbanTasks: vi.fn(() => mockKanbanTasksReturn),
}));

vi.mock("../hooks/useKanbanDnD.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useKanbanDnD: vi.fn(() => ({
      activeId: null,
      handleDragStart: vi.fn(),
      handleDragOver: vi.fn(),
      handleDragEnd: vi.fn(),
      handleDragCancel: vi.fn(),
      findTaskById: vi.fn(() => null),
    })),
  };
});

vi.mock("../hooks/useAllUsers.js", () => ({
  useAllUsers: vi.fn(() => ({
    users: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock("../hooks/useTaskMutations.js", () => ({
  useCreateTaskMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useUpdateTaskMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock("../components/Layout.jsx", () => ({
  default: ({ children }) => <div data-testid="layout-stub">{children}</div>,
}));

vi.mock("../services/firebase.js", () => ({
  app: {},
  auth: { currentUser: { uid: "test-user" } },
  db: {},
}));

function renderProtectedKanban() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/kanban"]}>
        <ProtectedRoute>
          <KanbanBoard />
        </ProtectedRoute>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("KanbanBoard integration", () => {
  it("renders task title when auth is logged in and useKanbanTasks has one todo task", () => {
    renderProtectedKanban();

    expect(screen.getByRole("heading", { name: /task management/i })).toBeInTheDocument();
    expect(screen.getByText(MOCK_TASK_TITLE)).toBeInTheDocument();
  });
});
