import { useTheme } from "../context/ThemeContext";

// Toggle switch adapted from Uiverse.io by ErzenXz
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <label className="toggle-switch" title="Toggle dark mode">
      <input
        type="checkbox"
        checked={isDark}
        onChange={toggleTheme}
        aria-label="Toggle dark mode"
      />
      <div className="toggle-switch-background">
        <div className="toggle-switch-handle"></div>
      </div>
    </label>
  );
}
