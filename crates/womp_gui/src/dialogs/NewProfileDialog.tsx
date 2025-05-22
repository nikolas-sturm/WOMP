import { useProfileStore } from "@/lib/profileStore";
import { Button, Input, Text } from "@fluentui/react-components";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useState } from "react";
import sanitize from "sanitize-filename";
import { useDialogStyles } from "@/styles/dialog";

function NewProfileDialog() {
  const classes = useDialogStyles();
  const { profiles, updateProfiles } = useProfileStore();
  const [saveDialogInput, setSaveDialogInput] = useState("");

  const handleSaveCurrentProfile = useCallback(
    async (profileName: string) => {
      const cleanedProfileName = sanitize(profileName.toLowerCase().replace(/-/g, "_"));
      if (cleanedProfileName.length === 0) {
        return;
      }
      const profileExists = profiles.find(
        (profile) => profile.name === cleanedProfileName,
      );
      if (profileExists) {
        return;
      }
      await invoke("save_current_display_layout", {
        profileName: cleanedProfileName,
      });
      await updateProfiles();
      await invoke("emit_to_window", {
        windowName: "main",
        event: "event",
        payload: "profiles_updated",
      });
      setSaveDialogInput("");
      handleClose();
    },
    [profiles, updateProfiles],
  );

  const handleClose = async () => {
    try {
      setSaveDialogInput("");
      const appWindow = getCurrentWindow();
      await appWindow.hide();
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  };

  return (
    <div className={classes.content}>
      <Text>Enter name for new profile</Text>
      <Input className={classes.input} value={saveDialogInput} onChange={(_, data) => setSaveDialogInput(data.value)} onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleSaveCurrentProfile(saveDialogInput);
        }
      }} />
      <div className={classes.buttonContainer}>
        <Button appearance="primary" onClick={() => handleSaveCurrentProfile(saveDialogInput)}>Save</Button>
        <Button appearance="subtle" className={classes.controlButton} onClick={handleClose}>Cancel</Button>
      </div>
    </div>
  )
}

export default NewProfileDialog;
