import { NavigationView } from "@/components/NavigationView";
import { ProfileEditor } from "@/components/ProfileEditor";
import { Settings } from "@/components/Settings";
import { Titlebar } from "@/components/Titlebar";
import { useProfileStore } from "@/lib/profileStore";
import { makeStyles } from "@fluentui/react-components";
import { useEffect } from "react";
import "./App.css";

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

function App() {
  const classes = useStyles();

  const { initProfiles, selectedProfile } = useProfileStore();

  useEffect(() => {
    initProfiles();
  }, [initProfiles]);

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
