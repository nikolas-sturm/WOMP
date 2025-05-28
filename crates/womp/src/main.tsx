import App from "@/App";
import Dialog from "@/Dialog";
import { useThemeStore } from "@/lib/themeStore";
import { FluentProvider, makeStyles } from "@fluentui/react-components";
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { useGlobalConfigStore } from "./lib/globalConfig";
const useStyles = makeStyles({
  center: {
    padding: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
});

const searchParams = new URLSearchParams(window.location.search);
const view = searchParams.get("view");

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { getGlobalConfig } = useGlobalConfigStore();
  const { getActiveTheme, initThemes, error, initialized } = useThemeStore();

  const classes = useStyles();

  useEffect(() => {
    if (initialized) { return; }
    getGlobalConfig().then(() => {
      initThemes();
    });
  }, [initThemes, initialized, getGlobalConfig]);

  const theme = getActiveTheme();

  if (!initialized) {
    return null;
  }

  if (error) {
    return (
      <FluentProvider theme={theme}>
        <div className={classes.center}>Error loading theme: {error}</div>
      </FluentProvider>
    );
  }

  return <FluentProvider theme={theme}>{children}</FluentProvider>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  //<React.StrictMode>
  <ThemeProvider>
    {view === "main" ? <App /> : <Dialog />}
  </ThemeProvider>
  //</React.StrictMode>
);
