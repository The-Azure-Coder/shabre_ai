"use client";

import { useEffect, useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, Section } from "@/components/ui/surfaces";
import { Icon } from "@/lib/icons";

const settingSections = [
  { key: "general", title: "General", description: "Basic preferences", icon: "sliders" },
  { key: "notifications", title: "Notifications", description: "Manage alerts", icon: "bell" },
  { key: "appearance", title: "Appearance", description: "Theme and display", icon: "palette" },
  { key: "language", title: "Language", description: "Regional settings", icon: "globe" },
  { key: "autosave", title: "Auto-save", description: "Save your work", icon: "cloud" },
  { key: "privacy", title: "Privacy & Security", description: "Security preferences", icon: "shield" },
  { key: "advanced", title: "Advanced", description: "Developer options", icon: "code" },
];

const landingPages = ["Dashboard", "Reviews", "My Documents", "Utilities Hub"];
const itemsPerPageOptions = ["10", "20", "30", "50"];
const editorModes = ["Visual", "Split", "Source"];

export function SettingsWorkspacePage() {
  const [state, setState] = useState({ status: "loading", data: null, error: "" });
  const [theme, setTheme] = useState("light");
  const [selectedSection, setSelectedSection] = useState("general");
  const [landingPage, setLandingPage] = useState("Dashboard");
  const [itemsPerPage, setItemsPerPage] = useState("10");
  const [editorMode, setEditorMode] = useState("Visual");
  const [grammarEnabled, setGrammarEnabled] = useState(true);

  useEffect(() => {
    setTheme(window.localStorage.getItem("smartreview-theme") || "light");

    async function load() {
      const token = window.localStorage.getItem("smartreview-token");
      try {
        const response = await fetch("/api/v1/settings", { headers: { Authorization: `Bearer ${token}` } });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "Unable to load settings");
        setState({ status: "idle", data: payload, error: "" });
        setGrammarEnabled(payload.preferences?.suggestions ?? true);
      } catch (error) {
        setState({ status: "idle", data: null, error: error.message });
      }
    }

    load();
  }, []);

  function applyTheme(value) {
    setTheme(value);
    document.documentElement.dataset.theme = value;
    window.localStorage.setItem("smartreview-theme", value);
  }

  const language = state.data?.preferences.language || "English";
  const notifications = state.data?.preferences.notifications ?? true;
  const autoSave = state.data?.preferences.autoSave ?? true;

  return (
    <main className="workspace-screen">
      <div className="workspace-screen__container workspace-screen__container--full">
        <Section
          className="workspace-title-block"
          title="Settings"
          description="Manage your preferences and customize your experience."
        />

        <div className="settings-workspace">
          <aside className="settings-sidebar">
            {settingSections.map((section) => (
              <button
                key={section.key}
                type="button"
                className={`settings-nav-card${selectedSection === section.key ? " is-active" : ""}`}
                onClick={() => setSelectedSection(section.key)}
              >
                <span className="settings-nav-card__icon">
                  <Icon name={section.icon} />
                </span>
                <span className="settings-nav-card__copy">
                  <strong>{section.title}</strong>
                  <span>{section.description}</span>
                </span>
              </button>
            ))}
          </aside>

          <div className="settings-panels">
            {state.status === "loading" ? <Card><p>Loading settings...</p></Card> : null}
            {state.error ? <Card><p className="error-text">{state.error}</p></Card> : null}

            <Section className="settings-panel" title="General Preferences" description="Configure basic application settings.">
              <div className="settings-control-list">
                <label className="settings-control-row">
                  <span className="settings-control-row__copy">
                    <strong>Default landing page</strong>
                    <span>Choose the page you see when you log in</span>
                  </span>
                  <span className="settings-select-wrap">
                    <Icon name="grid" />
                    <select value={landingPage} onChange={(event) => setLandingPage(event.target.value)}>
                      {landingPages.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <Icon name="chevron-down" />
                  </span>
                </label>

                <label className="settings-control-row">
                  <span className="settings-control-row__copy">
                    <strong>Items per page</strong>
                    <span>Set the number of items to display in lists</span>
                  </span>
                  <span className="settings-select-wrap settings-select-wrap--compact">
                    <select value={itemsPerPage} onChange={(event) => setItemsPerPage(event.target.value)}>
                      {itemsPerPageOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <Icon name="chevron-down" />
                  </span>
                </label>
              </div>
            </Section>

            <Section className="settings-panel" title="Editor Preferences" description="Customize your editing experience.">
              <div className="settings-control-list">
                <div className="settings-control-row">
                  <span className="settings-control-row__copy">
                    <strong>Default editor mode</strong>
                    <span>Choose your preferred editor mode</span>
                  </span>
                  <div className="settings-segmented">
                    {editorModes.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={editorMode === mode ? "is-active" : ""}
                        onClick={() => setEditorMode(mode)}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settings-control-row">
                  <span className="settings-control-row__copy">
                    <strong>Check grammar while typing</strong>
                    <span>Automatically check grammar in the editor</span>
                  </span>
                  <button
                    type="button"
                    className={`settings-switch${grammarEnabled ? " is-on" : ""}`}
                    aria-pressed={grammarEnabled}
                    aria-label={grammarEnabled ? "Disable grammar check while typing" : "Enable grammar check while typing"}
                    onClick={() => setGrammarEnabled((value) => !value)}
                  >
                    <span className="settings-switch__thumb" />
                  </button>
                </div>
              </div>
            </Section>

            <Section className="settings-panel" title="Data & Storage" description="Manage your local data and storage preferences.">
              <div className="settings-control-list">
                <div className="settings-control-row">
                  <span className="settings-control-row__copy">
                    <strong>Theme</strong>
                    <span>Current mode: {theme === "dark" ? "Dark" : "Light"} mode</span>
                  </span>
                  <div className="settings-inline-actions">
                    <Button variant={theme === "light" ? "primary" : "ghost"} size="sm" onClick={() => applyTheme("light")}>Light</Button>
                    <Button variant={theme === "dark" ? "primary" : "ghost"} size="sm" onClick={() => applyTheme("dark")}>Dark</Button>
                  </div>
                </div>

                <div className="settings-control-row">
                  <span className="settings-control-row__copy">
                    <strong>Language</strong>
                    <span>Current language and regional defaults</span>
                  </span>
                  <span className="settings-pill">{language}</span>
                </div>

                <div className="settings-control-row">
                  <span className="settings-control-row__copy">
                    <strong>Notifications</strong>
                    <span>Email and in-app notifications are currently {notifications ? "enabled" : "disabled"}</span>
                  </span>
                  <span className="settings-pill">{notifications ? "On" : "Off"}</span>
                </div>

                <div className="settings-control-row">
                  <span className="settings-control-row__copy">
                    <strong>Auto-save</strong>
                    <span>Your writing workspace auto-save is currently {autoSave ? "enabled" : "disabled"}</span>
                  </span>
                  <span className="settings-pill">{autoSave ? "On" : "Off"}</span>
                </div>

                <div className="settings-control-row">
                  <span className="settings-control-row__copy">
                    <strong>Clear local cache</strong>
                    <span>Remove temporary files and cached data</span>
                  </span>
                  <button type="button" className={buttonClasses({ variant: "ghost", size: "md", className: "settings-action-button" })}>
                    <Icon name="trash" />
                    <span>Clear Cache</span>
                  </button>
                </div>

                <div className="settings-control-row">
                  <span className="settings-control-row__copy">
                    <strong>Export my data</strong>
                    <span>Download a copy of your data</span>
                  </span>
                  <button type="button" className={buttonClasses({ variant: "ghost", size: "md", className: "settings-action-button" })}>
                    <Icon name="download" />
                    <span>Export Data</span>
                  </button>
                </div>
              </div>
            </Section>

            <Card className="settings-danger-card">
              <div className="settings-danger-card__copy">
                <h3>Danger Zone</h3>
                <p>Irreversible and destructive actions.</p>
              </div>
              <button type="button" className="settings-danger-button">
                <Icon name="trash" />
                <span>Delete Account</span>
              </button>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
