import { Button, mergeClasses } from "@fluentui/react-components";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { useTitlebarStyles } from "@/styles/titlebar";

export function Titlebar() {
  const styles = useTitlebarStyles();
  const [isMaximized, setIsMaximized] = useState(false);
  const [windowTitle, setWindowTitle] = useState("WOMP");

  useEffect(() => {
    // Get current window instance
    const appWindow = getCurrentWindow();

    // Update maximized state and listen for changes
    const updateMaximizedState = async () => {
      try {
        const maximized = await appWindow.isMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.error("Failed to get window state:", error);
      }
    };

    // Get initial state
    updateMaximizedState();

    // Listen for maximize and unmaximize events
    const unlisten1 = appWindow.onResized(() => {
      updateMaximizedState();
    });

    // Get window title
    appWindow.title().then((title: string) => {
      if (title) setWindowTitle(title);
    });

    // Cleanup listeners
    return () => {
      unlisten1.then((unlisten: () => void) => unlisten());
    };
  }, []);

  const handleMinimize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (error) {
      console.error("Failed to minimize window:", error);
    }
  };

  const handleMaximizeRestore = async () => {
    try {
      const appWindow = getCurrentWindow();
      if (isMaximized) {
        await appWindow.unmaximize();
      } else {
        await appWindow.maximize();
      }
      setIsMaximized(!isMaximized);
    } catch (error) {
      console.error("Failed to maximize/restore window:", error);
    }
  };

  const handleClose = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  };

  return (
    <div className={styles.titlebar} data-tauri-drag-region>
      <div className={styles.title} data-tauri-drag-region>
        <span className={styles.titleIcon}>&#xE7F4;</span>
        &nbsp;&nbsp;&nbsp;&nbsp;{windowTitle}
      </div>
      <div className={styles.windowControls}>
        <Button
          appearance="transparent"
          aria-label="Minimize"
          className={styles.controlButton}
          onClick={handleMinimize}
        >
          &#xE921;
        </Button>
        <Button
          appearance="transparent"
          aria-label={isMaximized ? "Restore" : "Maximize"}
          className={styles.controlButton}
          onClick={handleMaximizeRestore}
        >
          {isMaximized ? "\uE923" : "\uE922"}
        </Button>
        <Button
          appearance="transparent"
          aria-label="Close"
          className={mergeClasses(styles.controlButton, styles.closeButton)}
          onClick={handleClose}
        >
          &#xE8BB;
        </Button>
      </div>
    </div>
  );
}
