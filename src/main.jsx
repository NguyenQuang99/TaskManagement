import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { queryClient } from "./queryClient.js";
import { getSavedStartPath } from "./components/UserSetting/StartPage.jsx";

const PATHS_RESPECT_START_ON_RELOAD = new Set(["/", "/kanban", "/profile"]);

function syncStartPageOnFullReload() {
  const nav = performance.getEntriesByType("navigation")[0];
  if (!nav || nav.type !== "reload") return false;

  const currentPath = window.location.pathname;
  if (!PATHS_RESPECT_START_ON_RELOAD.has(currentPath)) return false;

  const targetPath = getSavedStartPath();
  if (currentPath === targetPath) return false;

  window.location.replace(targetPath);
  return true;
}

if (syncStartPageOnFullReload()) {
  // Đã chuyển trang cứng theo start page; bỏ qua mount hiện tại.
} else {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  );
}
