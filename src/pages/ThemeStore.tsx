import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/useThemeStore";
import { playWarningForTheme } from "../utils/audioSynth";
import type { ThemeConfig } from "../themes/types";

export const ThemeStore: React.FC = () => {
  const navigate = useNavigate();
  const activeThemeId = useThemeStore((state) => state.activeThemeId);
  const customThemes = useThemeStore((state) => state.customThemes);
  const applyTheme = useThemeStore((state) => state.applyTheme);
  const installTheme = useThemeStore((state) => state.installTheme);
  const uninstallTheme = useThemeStore((state) => state.uninstallTheme);
  const allThemes = useThemeStore.getState().getAllThemes();

  // Custom Theme JSON Paste State
  const [jsonInput, setJsonInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleInstall = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!jsonInput.trim()) {
      setErrorMsg("Please paste a JSON theme config first.");
      return;
    }

    try {
      const theme = installTheme(jsonInput);
      setSuccessMsg(`Successfully installed skin: ${theme.name}!`);
      setJsonInput("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to install theme.");
    }
  };

  const handleApply = (id: string) => {
    try {
      applyTheme(id);
      setSuccessMsg(`Theme '${id}' applied successfully!`);
      // Clear message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to apply theme.");
    }
  };

  const handleUninstall = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to uninstall theme '${id}'?`)) {
      try {
        uninstallTheme(id);
        setSuccessMsg(`Theme '${id}' uninstalled.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to uninstall theme.");
      }
    }
  };

  return (
    <div className="app-container theme-store-container">
      {/* Header */}
      <div className="app-header store-header">
        <button className="back-btn" onClick={() => navigate("/")} title="Back to Focus Arena">
          ← Back to Arena
        </button>
        <h1 className="app-title store-title">THEME STUDIO</h1>
      </div>

      {/* Main Content scrollable */}
      <div className="app-content store-content">
        {/* Status Alerts */}
        {successMsg && <div className="store-alert success">{successMsg}</div>}
        {errorMsg && <div className="store-alert error">{errorMsg}</div>}

        <div className="store-intro">
          <h2>Select focus skin for Panic Mode</h2>
          <p>Choose an environment tailored to your focus style. Skins change typography, borders, alerts, backgrounds, and audio click tempos.</p>
        </div>

        {/* Skins Grid */}
        <div className="themes-grid">
          {/* Default Theme Card */}
          <div 
            className={`theme-card ${activeThemeId === "default" ? "active" : ""}`}
            onClick={() => handleApply("default")}
          >
            <div className="theme-card-header">
              <div>
                <h3 className="theme-name">Standard Classic</h3>
                <span className="theme-author">By System</span>
              </div>
              {activeThemeId === "default" && <span className="active-badge">Active</span>}
            </div>
            
            {/* Swatches */}
            <div className="theme-colors-preview">
              <span className="color-dot" style={{ backgroundColor: "var(--color-panic)", border: "1px solid var(--color-border)" }} title="Accent Color" />
              <span className="color-dot" style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-border)" }} title="Background" />
              <span className="color-dot" style={{ backgroundColor: "var(--color-text)", border: "1px solid var(--color-border)" }} title="Text Color" />
            </div>

            <div className="theme-details">
              <span>Effect: Standard pulse</span>
              <span>Font: Inter Sans</span>
            </div>

            <div className="theme-card-actions">
              <button 
                className="preview-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  playWarningForTheme({
                    id: "default",
                    name: "default",
                    styles: {
                      colors: {
                        "--theme-color-panic": "",
                        "--theme-color-panic-bg": "",
                        "--theme-color-panic-border": "",
                        "--theme-color-text": "",
                        "--theme-color-overlay-bg": "",
                        "--theme-color-container-bg": ""
                      },
                      fonts: { "--theme-font-sans": "" },
                      spacing: {},
                      effects: {}
                    },
                    sounds: {}
                  } as ThemeConfig);
                }}
              >
                🔊 Play Chime
              </button>
              <button className="apply-btn">Apply Skin</button>
            </div>
          </div>

          {/* Preset & Custom Themes */}
          {allThemes.map((theme) => {
            const isActive = activeThemeId === theme.id;
            const isCustom = customThemes.some((t) => t.id === theme.id);

            return (
              <div 
                key={theme.id}
                className={`theme-card ${isActive ? "active" : ""}`}
                onClick={() => handleApply(theme.id)}
              >
                <div className="theme-card-header">
                  <div>
                    <h3 className="theme-name">{theme.name}</h3>
                    <span className="theme-author">By {theme.author || "Unknown"}</span>
                  </div>
                  {isActive && <span className="active-badge">Active</span>}
                </div>

                {/* Swatches */}
                <div className="theme-colors-preview">
                  <span 
                    className="color-dot" 
                    style={{ backgroundColor: theme.styles.colors["--theme-color-panic"] }} 
                    title="Panic Accent"
                  />
                  <span 
                    className="color-dot" 
                    style={{ backgroundColor: theme.styles.colors["--theme-color-container-bg"] }} 
                    title="Container Background"
                  />
                  <span 
                    className="color-dot" 
                    style={{ backgroundColor: theme.styles.colors["--theme-color-text"] }} 
                    title="Primary Text"
                  />
                </div>

                <div className="theme-details">
                  <span>Effect: {theme.styles.effects.overlayType || "none"}</span>
                  <span>Font: {theme.styles.fonts["--theme-font-sans"].split(",")[0].replace(/'/g, "")}</span>
                </div>

                <div className="theme-card-actions">
                  <button 
                    className="preview-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      playWarningForTheme(theme);
                    }}
                  >
                    🔊 Play Chime
                  </button>
                  <div className="action-buttons-group">
                    {isCustom && (
                      <button 
                        className="uninstall-btn"
                        onClick={(e) => handleUninstall(theme.id, e)}
                        title="Uninstall custom theme"
                      >
                        🗑️
                      </button>
                    )}
                    <button className="apply-btn">Apply Skin</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom JSON Installer */}
        <div className="installer-section">
          <h3>Install Custom Skin Plugin</h3>
          <p className="installer-hint">Paste theme JSON below. Themes must define styles (colors, spacing, fonts, effects) and synthesizer parameters.</p>
          
          <form onSubmit={handleInstall} className="installer-form">
            <textarea
              className="json-textarea"
              placeholder='{ "id": "my-theme", "name": "Golden Glow", "author": "Hacker", "styles": { ... }, "sounds": { ... } }'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            <button type="submit" className="install-submit-btn">
              ⚡ Install Theme Plugin
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
