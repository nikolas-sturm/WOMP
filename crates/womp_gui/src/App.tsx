import { Button, makeStyles, List, ListItem, Label } from "@fluentui/react-components";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import "./App.css";
import { ThemeToggle } from "./ThemeToggle";

const useStyles = makeStyles({
  root: {
    height: "100vh",
    width: "100vw",
  },
});

function App() {
  const classes = useStyles();

  const [profiles, setProfiles] = useState<string[]>([]);

  async function get_profiles() {
    const profiles: string[] = await invoke("get_profiles");
    setProfiles(profiles);
  }

  return (
    <main className={classes.root}>
      <ThemeToggle />

      <Button appearance="primary" onClick={async () => await get_profiles()}>
        Click me
      </Button>
      <Label>Profiles</Label>
      <List>
        {profiles.map((profile) => (
          <ListItem key={profile}>{profile}</ListItem>
        ))}
      </List>
    </main>
  );
}

export default App;
