import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { FluentProvider } from "@fluentui/react-components";
import { useThemeStore } from "./zustand";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  return <FluentProvider theme={theme}>{children}</FluentProvider>;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
