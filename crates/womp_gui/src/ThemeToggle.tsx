import { webLightTheme } from "@fluentui/react-components";
import { webDarkTheme } from "@fluentui/react-components";
import { Button } from "@fluentui/react-components";
import { useThemeStore } from "./zustand";
import { invoke } from "@tauri-apps/api/core";


export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const handleClick = () => {
    const newTheme = theme === webDarkTheme ? webLightTheme : webDarkTheme;
    setTheme(newTheme);
    invoke("change_theme", { dark: newTheme === webDarkTheme });
  };

  return <Button onClick={handleClick}>Toggle Theme</Button>;
}