import { NavigationView } from "@/components/NavigationView";
import { ProfileEditor } from "@/components/ProfileEditor";
import { Settings } from "@/components/Settings";
import { Titlebar } from "@/components/Titlebar";
import { useUpdateChecker } from "@/components/UpdaterDialog";
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
  const userDeclinedUpdateRef = useRef(false);
  const hasAutoCheckedRef = useRef(false);

  const {
    initProfiles,
    selectedProfile,
    profiles,
    initialized,
    activeProfile,
  } = useProfileStore();
  const { globalConfig, getGlobalConfig } = useGlobalConfigStore();
  const { silentCheckForUpdates, UpdaterDialog } = useUpdateChecker();

  useEffect(() => {
    const init = async () => {
      initProfiles();

      const window = getCurrentWindow();
      const unlisten_event = await window.listen("event", async (e) => {
        if (e.payload === "profiles_updated") {
          await initProfiles();
        }
      });
      
      // Listen for second-instance events
      const unlisten_second_instance = await window.listen("second-instance", (event) => {
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
        unlisten_event();
          unlisten_second_instance();
        };
      };
    init();
  }, [initProfiles]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (initializingRef.current === "none") {
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
      updateTray(profiles, activeProfile, globalConfig.tray_icon).catch(
        (error) => {
          console.error("Failed to update tray:", error);
        },
      );
    }
  }, [initialized, profiles, activeProfile, globalConfig.tray_icon]);

  useEffect(() => {
    // Initialize global config on app startup
    getGlobalConfig();
  }, [getGlobalConfig]);

  // Auto update check on startup
  useEffect(() => {
    if (initialized && globalConfig.auto_update && !userDeclinedUpdateRef.current && !hasAutoCheckedRef.current) {
      hasAutoCheckedRef.current = true;
      // Add a small delay to ensure everything is initialized
      const timer = setTimeout(() => {
        silentCheckForUpdates();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [initialized, globalConfig.auto_update]);

  const handleUpdateDeclined = () => {
    userDeclinedUpdateRef.current = true;
  };

  return (
    <>
      <Titlebar />
      <main className={classes.root}>
        <NavigationView />
        {selectedProfile === "settings" ? <Settings /> : <ProfileEditor />}
      </main>
      <UpdaterDialog onLater={handleUpdateDeclined} />
    </>
  );
}

export default App;
