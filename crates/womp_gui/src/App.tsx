import { NavigationView } from "@/components/NavigationView";
import { ProfileEditor } from "@/components/ProfileEditor";
import { Settings } from "@/components/Settings";
import { Titlebar } from "@/components/Titlebar";
import { useProfileStore } from "@/lib/profileStore";
import { makeStyles } from "@fluentui/react-components";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";
import "./App.css";
import { createTray, updateTray } from "./tray";

const useStyles = makeStyles({
  root: {
    height: "calc(100vh - 50px)",
    width: "100vw",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "50px",
  },
});

type State = "none" | "loading" | "initialized" | "error"

function App() {
  const classes = useStyles();
  const initializingRef = useRef<State>("none");

  const { initProfiles, selectedProfile, profiles, initialized, updateProfiles } = useProfileStore();

  useEffect(() => {
    initProfiles();

    const window = getCurrentWindow();
    window.listen("event", (e) => {
      if (e.payload === "profiles_updated") {
        updateProfiles();
      }
    });
  }, [initProfiles]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (initializingRef.current === "none") {
      console.log("Initializing tray");
      initializingRef.current = "loading";
      createTray(profiles)
        .then(() => {
          initializingRef.current = "initialized";
        })
        .catch(error => {
          initializingRef.current = "error";
          console.error("Failed to initialize tray:", error);
        });
    } else if (initializingRef.current === "initialized") {
      updateTray(profiles).catch(error => {
        console.error("Failed to update tray:", error);
      });
    }
  }, [initialized, profiles]);

  return (
    <>
      <Titlebar />
      <main className={classes.root}>
        <NavigationView />
        {selectedProfile === "settings" ? <Settings /> : <ProfileEditor />}
      </main>
    </>
  );
}

export default App;
