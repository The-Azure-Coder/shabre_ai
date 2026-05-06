import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/lib/icons";
import { demoUser } from "@/lib/demo-data";

export function Topbar({ theme, onThemeChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const menuRef = useRef(null);
  const [user, setUser] = useState(demoUser);
  const [open, setOpen] = useState(false);

  function handleLogout() {
    window.localStorage.removeItem("smartreview-token");
    window.localStorage.removeItem("smartreview-user");
    navigate({ to: "/login", replace: true });
  }

  const pageTitle = useMemo(() => pathname?.startsWith("/reviews/") ? "Review Details" : pageTitles[pathname] || "SmartReview AI", [pathname]);

  useEffect(() => {
    const stored = window.localStorage.getItem("smartreview-user");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const name = parsed.name || demoUser.name;
      setUser({
        name,
        role: "Student",
        avatarInitials: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
      });
    } catch {}
  }, []);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="topbar">
      <h2>{pageTitle}</h2>
      <label className="search-box">
        <Icon name="search" />
        <input placeholder="Search anything..." aria-label="Search anything" />
        <kbd>Ctrl K</kbd>
      </label>
      <div className="topbar-actions">
        <button className="icon-button" aria-label="Notifications">
          <Icon name="bell" />
        </button>
        <Link className="icon-button" to="/help" aria-label="Help">
          <Icon name="help-circle" />
        </Link>
        <div className="profile-menu" ref={menuRef}>
          <div className="profile">
            <div className="avatar">{user.avatarInitials}</div>
            <div className="profile-meta">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
            <button
              className="profile-toggle"
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-haspopup="menu"
              aria-label={open ? "Close profile menu" : "Open profile menu"}
            >
              <Icon name="chevron-down" className="profile-chevron" />
            </button>
          </div>
          {open && (
            <div className="profile-dropdown" role="menu">
              <Link to="/profile" role="menuitem">Profile</Link>
              <Link to="/settings" role="menuitem">Settings</Link>
              <div className="dropdown-section">
                <strong>Theme</strong>
                <button type="button" className={theme === "light" ? "selected" : ""} onClick={() => onThemeChange("light")}>Light Mode</button>
                <button type="button" className={theme === "dark" ? "selected" : ""} onClick={() => onThemeChange("dark")}>Dark Mode</button>
              </div>
              <div className="dropdown-section">
                <button type="button" onClick={handleLogout} className="error-text">Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const pageTitles = {
  "/dashboard": "Dashboard",
  "/documents": "My Documents",
  "/reviews": "Reviews",
  "/rubrics": "Rubric Evaluations",
  "/formatting": "Formatting Checker",
  "/writing-tools": "Writing Tools",
  "/ai-detector": "AI Detector",
  "/humanizer": "Humanizer",
  "/utilities": "Utilities",
  "/summarizer": "Summarizer",
  "/citations": "Citation Generator",
  "/profile": "Profile",
  "/settings": "Settings",
  "/help": "Help & Support",
};
