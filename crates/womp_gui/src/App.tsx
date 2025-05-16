import { BackButton } from "@/components/BackButton";
import { Content } from "@/components/Content";
import { NavigationView } from "@/components/NavigationView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Titlebar } from "@/components/Titlebar";
import { useNavigationStore } from "@/lib/navigationStore";
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

  const { selectedKey, setSelectedKey } = useNavigationStore();

  const { initProfiles } = useProfileStore();

  useEffect(() => {
    initProfiles();
  }, []);

  return (
    <>
      <Titlebar />
      <main className={classes.root}>
        <NavigationView
          selectedKey={selectedKey}
          onSelectedKeyChange={setSelectedKey}
        />
        <Content />
      </main>
      <BackButton />
      <ThemeToggle />
    </>
  );
}

export default App;
