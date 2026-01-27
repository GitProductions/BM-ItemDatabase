"use client";

import { useEffect, useState } from "react";

const storageKey = "gitproductions-theme";

type Theme = "light" | "dark";

const getPreferredTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") return stored;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(storageKey, theme);
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const preferred = getPreferredTheme();
    requestAnimationFrame(() => {
      setTheme(preferred);
      applyTheme(preferred);
      setMounted(true);
    });
  }, []);

  const handleToggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      className="button ghost"
      aria-label="Toggle theme"
      onClick={handleToggle}
      disabled={!mounted}
    >
      <span aria-hidden>{theme === "light" ? "🌙" : "☀️"}</span>
      <span>{mounted ? `${theme === "light" ? "Dark" : "Light"} mode` : "Theme"}</span>
    </button>
  );
}
