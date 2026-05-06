"use client";

import { useEffect, useState, useMemo } from "react";
import { useLocation } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AuthGuard } from "@/components/layout/auth-guard";

export function AppFrame({ children }) {
  const location = useLocation();
  const pathname = location.pathname;
  const [theme, setTheme] = useState("light");
  
  // Public routes that don't need the dashboard layout or auth guard
  const isAuthPage = useMemo(() => {
    return pathname === "/login" || pathname === "/signup";
  }, [pathname]);

  useEffect(() => {
    const saved = window.localStorage.getItem("smartreview-theme");
    const initial = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function handleThemeChange(newTheme) {
    setTheme(newTheme);
    document.documentElement.dataset.theme = newTheme;
    window.localStorage.setItem("smartreview-theme", newTheme);
  }

  if (isAuthPage) {
    return children;
  }

  return (
    <AuthGuard>
      <div className="app-shell">
        <Sidebar />
        <div className="workspace">
          <Topbar theme={theme} onThemeChange={handleThemeChange} />
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
