import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Đồng bộ state với một query string trên URL (vd `?q=...`).
 * Giá trị ghi vào URL được trim; rỗng thì xóa key.
 *
 * @param {string} [key="q"] — tên query param
 * @param {{ replace?: boolean }} [options] — `replace: true` dùng history.replace (mặc định)
 * @returns {[string, (next: string | ((prev: string) => string)) => void]}
 */
export function useSearchQueryParam(key = "q", options = {}) {
  const { replace = true } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? "";

  const setValue = useCallback(
    (next) => {
      const raw = typeof next === "function" ? next(value) : next;
      const nextParams = new URLSearchParams(searchParams);
      const trimmed = String(raw ?? "").trim();
      if (trimmed) nextParams.set(key, trimmed);
      else nextParams.delete(key);
      setSearchParams(nextParams, { replace });
    },
    [key, replace, searchParams, setSearchParams, value]
  );

  return [value, setValue];
}
