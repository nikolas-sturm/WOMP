import { NavigationView } from "@/components/NavigationView";
import { ProfileEditor } from "@/components/ProfileEditor";
import { Settings } from "@/components/Settings";
import { Titlebar } from "@/components/Titlebar";
import { useGlobalConfigStore } from "@/lib/globalConfig";
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

type State = "none" | "loading" | "initialized" | "error";

function App() {
  const classes = useStyles();
  const initializingRef = useRef<State>("none");

  const {
    initProfiles,
    selectedProfile,
    profiles,
    initialized,
    activeProfile,
  } = useProfileStore();
  const { globalConfig } = useGlobalConfigStore();

  useEffect(() => {
    initProfiles();

    const window = getCurrentWindow();
    window.listen("event", async (e) => {
      if (e.payload === "profiles_updated") {
        await initProfiles();
      }
    });
    
    // Listen for second-instance events
    window.listen("second-instance", (event) => {
      console.log("Second instance detected with args:", event.payload);
      
      // Make sure the window is visible and focused
      window.setFocus();
      window.unminimize();
      window.show();
      
      // Optionally, we could handle any command line arguments here
      // const args = event.payload as string[];
      // if (args.includes("--some-flag")) { ... }
    });
    
    return () => {
      // Clean up listeners when component unmounts
      window.unlisten("event");
      window.unlisten("second-instance");
    };
  }, [initProfiles]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (initializingRef.current === "none") {
      console.log("Initializing tray");
      console.log("config", globalConfig);
      initializingRef.current = "loading";
      createTray(profiles, activeProfile, globalConfig.tray_icon)
        .then(() => {
          initializingRef.current = "initialized";
        })
        .catch((error) => {
          initializingRef.current = "error";
          console.error("Failed to initialize tray:", error);
        });
    } else if (initializingRef.current === "initialized") {
      console.log("config", globalConfig);
      updateTray(profiles, activeProfile, globalConfig.tray_icon).catch(
        (error) => {
          console.error("Failed to update tray:", error);
        },
      );
    }
  }, [initialized, profiles, activeProfile, globalConfig.tray_icon]);

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
