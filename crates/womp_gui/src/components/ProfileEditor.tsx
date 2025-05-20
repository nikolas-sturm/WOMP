import { useProfileStore } from "@/lib/profileStore";
import type { Profile, Run, Config } from "@/lib/types";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Input,
  Label,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Text,
  Textarea,
  mergeClasses,
} from "@fluentui/react-components";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { ProfileName } from "@/components/ProfileName";
import { invoke } from "@tauri-apps/api/core";
import { useProfileEditorStyles } from "@/styles/profileEditor";

type EmojiData = {
  fallback: string;
  id: string;
  native: string;
  shortcodes: string;
  size: {
    value: string;
    // biome-ignore lint/suspicious/noExplicitAny:
    transform: (value: any) => any;
  };
  set: {
    value: string;
    choices: string[];
  };
  skin: {
    value: number;
    choices: number[];
  };
};

interface ProfileEditorStore {
  tempProfile: Profile | null;
  setTempProfile: (profile: Profile | null) => void;
}

const useProfileEditorStore = create<ProfileEditorStore>((set) => ({
  tempProfile: null,
  setTempProfile: (profile) => set({ tempProfile: profile }),
}));

export function ProfileEditor() {
  const styles = useProfileEditorStyles();
  const { selectedProfile, initProfiles, setSelectedProfile } =
    useProfileStore();
  const { tempProfile, setTempProfile } = useProfileEditorStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (selectedProfile !== "settings") {
      setTempProfile(selectedProfile);
    }
  }, [selectedProfile, setTempProfile]);

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteProfile = async () => {
    await invoke("delete_profile", { profileName: tempProfile?.name });
    initProfiles();
    setDeleteDialogOpen(false);
    setSelectedProfile(null);
  };

  const handleOpenProfileFolder = async () => {
    await invoke("open_profile_dir", {
      profileName: tempProfile?.name,
    });
  };

  const handleCloneProfile = async () => {
    const new_profile_name: string = await invoke("clone_profile", {
      profileName: tempProfile?.name,
    });
    const new_profiles = await initProfiles();
    setSelectedProfile(
      new_profiles.find((profile) => profile.name === new_profile_name) ?? null,
    );
  };

  const handleSaveProfile = async () => {
    if (
      !selectedProfile ||
      selectedProfile === "settings" ||
      !tempProfile?.name
    ) {
      return;
    }
    const nameChanged = tempProfile?.name !== selectedProfile?.name;
    if (nameChanged) {
      await invoke("rename_profile", {
        oldName: selectedProfile.name,
        newName: tempProfile.name,
      });
    }
    if (tempProfile.config) {
      console.log("saving profile", tempProfile.name, tempProfile.config);
      await invoke("write_display_config", {
        config: tempProfile.config,
        profileName: tempProfile.name,
      });
    }
    const profiles = await initProfiles();
    if (nameChanged) {
      setSelectedProfile(
        profiles.find((profile) => profile.name === tempProfile.name) ?? null,
      );
    }
  };

  const handleApplyProfile = async () => {
    if (selectedProfile === "settings") {
      return;
    }
    const nameChanged = tempProfile?.name !== selectedProfile?.name;
    if (tempProfile && selectedProfile && nameChanged) {
      await invoke("rename_profile", {
        oldName: selectedProfile.name,
        newName: tempProfile.name,
      });
    }
    const configChanged =
      JSON.stringify(tempProfile?.config) !==
      JSON.stringify(selectedProfile?.config);
    if (tempProfile && selectedProfile && configChanged) {
      await invoke("write_display_config", {
        config: tempProfile.config,
        profileName: tempProfile.name,
      });
    }
    const profiles = await initProfiles();
    if (tempProfile && nameChanged) {
      setSelectedProfile(
        profiles.find((profile) => profile.name === tempProfile.name) ?? null,
      );
    }
    await invoke("apply_display_layout", {
      profileName: tempProfile?.name || selectedProfile?.name || "",
    });
  };

  const handleEmojiSelect = (emojiData: EmojiData, _: Event) => {
    const unicodeChar = emojiData.native;
    if (tempProfile) {
      setTempProfile({
        ...tempProfile,
        name: tempProfile.name,
        config: {
          ...tempProfile.config,
          icon: unicodeChar,
        } as Config,
      });
    }
    setPopoverOpen(false);
  };

  return (
    <div className={styles.root}>
      {tempProfile ? (
        <div className={styles.editorContainer}>
          <ProfileName profile={tempProfile} className={styles.title} />

          <div className={styles.fieldsContainer}>
            <div className={styles.fieldContainer}>
              <Label>Folder Name</Label>
              <Input
                className={mergeClasses(styles.input, styles.nameInput)}
                value={tempProfile?.name}
                onChange={(e) => {
                  setTempProfile({
                    ...tempProfile,
                    name: e.target.value,
                  });
                }}
              />
            </div>

            <div className={styles.nameAndIconContainer}>
              <div className={styles.fieldContainer}>
                <Label>Icon</Label>
                <Popover
                  positioning={"after"}
                  open={popoverOpen}
                  onOpenChange={(_, data) => setPopoverOpen(data.open)}
                >
                  <PopoverTrigger>
                    <Button
                      className={mergeClasses(styles.emojiButton, styles.input)}
                    >
                      {tempProfile?.config?.icon ?? ""}
                    </Button>
                  </PopoverTrigger>
                  <PopoverSurface className={styles.emojiPicker}>
                    <Picker data={data} onEmojiSelect={handleEmojiSelect} />
                  </PopoverSurface>
                </Popover>
              </div>
              <div
                className={mergeClasses(styles.fieldContainer, styles.flexGrow)}
              >
                <Label>Name</Label>
                <Input
                  className={styles.input}
                  value={tempProfile?.config?.name ?? ""}
                  onChange={(e) => {
                    setTempProfile({
                      ...tempProfile,
                      config: {
                        ...tempProfile.config,
                        name: e.target.value,
                      } as Config,
                    });
                  }}
                />
              </div>
            </div>

            <div className={styles.fieldContainer}>
              <Label>Description</Label>
              <Textarea
                value={tempProfile?.config?.description ?? ""}
                rows={3}
                className={styles.input}
                onChange={(e) => {
                  if (tempProfile?.config) {
                    setTempProfile({
                      ...tempProfile,
                      config: {
                        ...tempProfile.config,
                        description: e.target.value,
                      } as Config,
                    });
                  }
                }}
              />
            </div>

            <Label className={styles.sectionTitle}>Run</Label>
            <div className={styles.fieldContainer}>
              <Label>Before</Label>
              <Input
                className={styles.input}
                value={tempProfile?.config?.run?.before ?? ""}
                onChange={(e) => {
                  if (tempProfile?.config) {
                    setTempProfile({
                      ...tempProfile,
                      config: {
                        ...tempProfile.config,
                        run: {
                          ...tempProfile.config.run,
                          before: e.target.value,
                        } as Run,
                      } as Config,
                    });
                  }
                }}
              />
            </div>
            <div className={styles.fieldContainer}>
              <Label>After</Label>
              <Input
                className={styles.input}
                value={tempProfile?.config?.run?.after ?? ""}
                onChange={(e) => {
                  if (tempProfile?.config) {
                    setTempProfile({
                      ...tempProfile,
                      config: {
                        ...tempProfile.config,
                        run: {
                          ...tempProfile.config.run,
                          after: e.target.value,
                        } as Run,
                      } as Config,
                    });
                  }
                }}
              />
            </div>
          </div>
          <div className={styles.controlsContainer}>
            <div className={styles.controlsSection}>
              <Button
                className={styles.controlButton}
                appearance="subtle"
                onClick={handleOpenProfileFolder}
              >
                Open Folder
              </Button>
              <Button
                className={styles.controlButton}
                appearance="subtle"
                onClick={handleCloneProfile}
              >
                Clone
              </Button>
              <Button
                className={styles.controlButton}
                appearance="subtle"
                onClick={handleApplyProfile}
              >
                Apply
              </Button>
            </div>
            <div className={styles.controlsSection}>
              <Button
                className={styles.controlButton}
                appearance="subtle"
                onClick={openDeleteDialog}
              >
                Delete
              </Button>
              <Button
                className={styles.saveButton}
                appearance="primary"
                onClick={handleSaveProfile}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Text>Select an profile from the navigation menu to get started.</Text>
      )}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(_, data) => setDeleteDialogOpen(data.open)}
      >
        <DialogSurface className={styles.deleteDialog}>
          <DialogBody>
            <DialogTitle className={styles.deleteDialogTitle}>
              Delete Profile
            </DialogTitle>
            <DialogContent>
              <div className={styles.deleteDialogContent}>
                <div className={styles.deleteDialogDescription}>
                  <Text>Are you sure you want to delete this profile?</Text>
                </div>
                <div className={styles.deleteDialogButtons}>
                  <Button
                    appearance="primary"
                    className={styles.saveButton}
                    onClick={handleDeleteProfile}
                  >
                    Delete
                  </Button>
                  <Button
                    appearance="subtle"
                    className={styles.controlButton}
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
