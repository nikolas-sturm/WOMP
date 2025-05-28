import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import DeleteProfileDialog from "./dialogs/DeleteProfileDialog";
import NewProfileDialog from "./dialogs/NewProfileDialog";
import OverwriteProfileDialog from "./dialogs/OverwriteProfileDialog";
import { Titlebar } from "./components/Titlebar";
import { useDialogStyles } from "./styles/dialog";
type DialogType = "new-profile" | "save-profile" | "delete-profile" | null;

function Dialog() {
  const classes = useDialogStyles();
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [payload, setPayload] = useState<string | undefined>(undefined);

  useEffect(() => {
    const checkWindowTitle = async () => {
      const window = getCurrentWindow();
      window.listen("dialogType", async (e) => {
        console.log("Event:", e.event);
        if (e.payload === "new-profile") {
          setDialogType("new-profile");
          window.setTitle("Save Current Profile as ...");
          window.emit("event", "title-changed");
        } else if ((e.payload as string).startsWith("save-profile-")) {
          setPayload((e.payload as string).split("-").pop());
          setDialogType("save-profile");
          window.setTitle("Overwrite Profile");
          window.emit("event", "title-changed");
        } else if ((e.payload as string).startsWith("delete-profile-")) {
          setPayload((e.payload as string).split("-").pop());
          setDialogType("delete-profile");
          window.setTitle("Delete Profile");
          window.emit("event", "title-changed");
        } else {
          setDialogType(null);
        }
      });
    };

    checkWindowTitle();
  }, []);

  useEffect(() => {
    console.log("Payload:", payload);
    console.log("Dialog Type:", dialogType);
  }, [payload, dialogType]);

  return (
    <>
      <Titlebar onlyClose={true} />
      <main className={classes.root}>
        {dialogType === "new-profile" ? (
          <NewProfileDialog />
        ) : dialogType === "save-profile" ? (
          <OverwriteProfileDialog profileName={payload} />
        ) : dialogType === "delete-profile" ? (
          <DeleteProfileDialog profileName={payload} />
        ) : null}
      </main>
    </>
  );
}

export default Dialog;
