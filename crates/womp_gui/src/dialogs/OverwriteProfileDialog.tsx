import { useProfileStore } from "@/lib/profileStore";
import { useDialogStyles } from "@/styles/dialog";
import { Button, Text } from "@fluentui/react-components";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect } from "react";

function OverwriteProfileDialog({ profileName }: { profileName: string | undefined }) {
  const classes = useDialogStyles();
  const { updateProfiles } = useProfileStore();

  const handleOverwriteProfile = useCallback(async () => {
    await invoke("save_current_display_layout", { profileName });
    await updateProfiles();
    await invoke("emit_to_window", {
      windowName: "main",
      event: "event",
      payload: "profiles_updated",
    });
    handleClose();
  }, [profileName, updateProfiles]);

  const handleClose = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.hide();
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleOverwriteProfile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleOverwriteProfile]);

  if (!profileName) {
    return <p>No profile name received</p>;
  }

  return (
    <div className={classes.content}>
      <Text>Are you sure you want to overwrite the profile "{profileName}"?</Text>
      <div className={classes.buttonContainer}>
        <Button appearance="primary" onClick={handleOverwriteProfile}>Overwrite</Button>
        <Button appearance="subtle" className={classes.controlButton} onClick={handleClose}>Cancel</Button>
      </div>
    </div>
  )
}

export default OverwriteProfileDialog;
