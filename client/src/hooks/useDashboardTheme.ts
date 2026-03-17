import { useState, useEffect } from "react";

export type DashboardThemeMode = "light" | "dark" | "auto";

const STORAGE_KEY = "mydojo-dashboard-theme";

function getSystemPrefersDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function resolveIsDark(mode: DashboardThemeMode): boolean {
  if (mode === "light") return false;
  if (mode === "dark") return true;
  // "auto" — use system preference, but also consider time of day
  // (night = after 7pm or before 7am)
  const hour = new Date().getHours();
  const isNightTime = hour >= 19 || hour < 7;
  return getSystemPrefersDark() || isNightTime;
}

export function useDashboardTheme() {
  const [mode, setMode] = useState<DashboardThemeMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "auto") {
        return stored;
      }
    } catch {}
    return "light";
  });

  const [isDark, setIsDark] = useState(() => resolveIsDark(mode));

  useEffect(() => {
    setIsDark(resolveIsDark(mode));
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, [mode]);

  // Re-evaluate "auto" every minute in case time crosses the 7pm/7am boundary
  useEffect(() => {
    if (mode !== "auto") return;
    const interval = setInterval(() => {
      setIsDark(resolveIsDark("auto"));
    }, 60_000);
    return () => clearInterval(interval);
  }, [mode]);

  return { mode, setMode, isDark };
}
