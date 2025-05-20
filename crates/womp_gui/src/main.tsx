import App from "@/App";
import { useThemeStore } from "@/lib/themeStore";
import { FluentProvider, makeStyles } from "@fluentui/react-components";
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";

const useStyles = makeStyles({
  center: {
    padding: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
});

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { getActiveTheme, initThemes, error, initialized } = useThemeStore();

  const classes = useStyles();

  useEffect(() => {
    initThemes();
  }, [initThemes]);

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
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
