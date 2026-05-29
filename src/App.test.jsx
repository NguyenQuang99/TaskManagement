import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "./App.jsx";

vi.mock("./context/AuthContext.jsx", () => ({
  useAuth: vi.fn(() => ({
    user: null,
    ready: true,
    uid: "",
    isAuthenticated: false,
  })),
}));

vi.mock("./services/firebase.js", () => ({
  app: {},
  auth: { currentUser: null },
  db: {},
  login: vi.fn(),
  loginWithGoogle: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getCurrentUserProfile: vi.fn(async () => null),
  getAllUsers: vi.fn(async () => []),
  getTasksByColumn: vi.fn(async () => []),
  getTasksByColumnPage: vi.fn(async () => ({ tasks: [], lastDoc: null, hasMore: false })),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock("./lib/authQueryCache.js", () => ({
  prepareQueriesAfterLogin: vi.fn().mockResolvedValue(undefined),
  clearAuthSessionQueries: vi.fn(),
}));

function renderApp(initialPath = "/") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("App", () => {
  it("renders login route when auth is ready and user is signed out", () => {
    renderApp("/");

    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^login$/i })).toBeInTheDocument();
  });
});
