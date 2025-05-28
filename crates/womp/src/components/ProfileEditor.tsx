import { ProfileName } from "@/components/ProfileName";
import { useProfileStore } from "@/lib/profileStore";
import type { Config, Profile, Run, RunCommand } from "@/lib/types";
import { useProfileEditorStyles } from "@/styles/profileEditor";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Input,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Text,
  Textarea,
  mergeClasses
} from "@fluentui/react-components";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { Card, CardItem } from "./Card";
import { useGlobalConfigStore } from "@/lib/globalConfig";
import { StartupScreen } from "./StartupScreen";

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
  const { globalConfig } = useGlobalConfigStore();
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (selectedProfile !== "settings") {
      setTempProfile(selectedProfile);
    }
  }, [selectedProfile, setTempProfile]);

  const handleDeleteProfile = async () => {
    await invoke("delete_profile", { profileName: tempProfile?.name });
    initProfiles();
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
      await invoke("write_display_config", {
        config: tempProfile.config,
        profileName: tempProfile.name,
      });
    }
    const profiles = await initProfiles();
    setSelectedProfile(
      profiles.find((profile) => profile.name === tempProfile.name) ?? null,
    );
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

  const handleFileSelect = async (type: 'before' | 'after') => {
    const selected = await open({
      directory: false,
      multiple: false,
      filters: [
        { name: 'Executables', extensions: ['exe', 'bat', 'cmd', 'sh'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (selected && typeof selected === 'string' && tempProfile?.config) {
      const runCommand: RunCommand = {
        target: selected,
        args: tempProfile.config.run?.[type]?.args || ''
      };

      setTempProfile({
        ...tempProfile,
        config: {
          ...tempProfile.config,
          run: {
            ...tempProfile.config.run,
            [type]: runCommand
          } as Run
        } as Config
      });
    }
  };

  const handleClearRunCommand = (type: 'before' | 'after', field: 'target' | 'args') => {
    if (tempProfile?.config) {
      setTempProfile({
        ...tempProfile,
        config: {
          ...tempProfile.config,
          run: {
            ...tempProfile.config.run,
            [type]: {
              ...tempProfile.config.run?.[type],
              [field]: ''
            } as RunCommand
          } as Run
        } as Config
      });
    }
  };

  if (selectedProfile === "settings") {
    return null;
  }

  return (
    <div className={styles.root}>
      {tempProfile ? (
        <div className={styles.editorContainer}>
          <ProfileName showIcon profile={selectedProfile} className={styles.title} />

          <div className={styles.section}>
            <Card
              header="Profile ID"
              icon={"\uF439"}
              expandable
            >
              <CardItem
                header="Internal ID"
                description="Enter an ID for the profile"
                control={
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
                }
              />
            </Card>

            <Card
              header="Icon & Name"
              icon={"\uE932"}
              expandable
            >
              <CardItem
                header="Icon"
                description="Select an icon for the profile"
                control={
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
                }
              />
              <CardItem
                header="Name"
                description="Enter a name for the profile"
                control={
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
                }
              />
            </Card>

            <Card
              header="Description"
              icon={"\uE8E4"}
              expandable
            >
              <CardItem
                fullWidthControl
                control={
                  <Textarea
                    value={tempProfile?.config?.description ?? ""}
                    rows={3}
                    className={mergeClasses(styles.input, styles.textArea)}
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
                }
              />
            </Card>

            <Card
              header="Run Before"
              icon={"\uE756"}
              expandable
              disabled={!globalConfig.run_commands}
            >
              <CardItem
                header="Target"
                description="Executable to run before apply"
                control={
                  <div className={styles.fileRow}>
                    <Input
                      className={mergeClasses(styles.input, styles.targetInput)}
                      value={tempProfile?.config?.run?.before?.target || ""}
                      placeholder="Target executable path"
                      contentAfter={
                        <Button
                          icon={"\uE894"}
                          className={styles.clearButton}
                          appearance="transparent"
                          onClick={() => handleClearRunCommand('before', 'target')}
                        />
                      }
                      onChange={(e) => {
                        if (tempProfile?.config) {
                          const runCommand: RunCommand = {
                            target: e.target.value,
                            args: tempProfile.config.run?.before?.args || ''
                          };

                          setTempProfile({
                            ...tempProfile,
                            config: {
                              ...tempProfile.config,
                              run: {
                                ...tempProfile.config.run,
                                before: runCommand
                              } as Run
                            } as Config
                          });
                        }
                      }}
                    />
                    <Button
                      appearance="secondary"
                      className={styles.browseButton}
                      onClick={() => handleFileSelect('before')}
                      icon={"\uE838"}
                    />
                  </div>
                }
              />
              <CardItem
                fullWidthControl
                control={
                  <Textarea
                    className={mergeClasses(styles.input, styles.textArea)}
                    value={tempProfile?.config?.run?.before?.args || ""}
                    placeholder="Command arguments"
                    onChange={(e) => {
                      if (tempProfile?.config) {
                        const runCommand: RunCommand = {
                          target: tempProfile.config.run?.before?.target || '',
                          args: e.target.value
                        };

                        setTempProfile({
                          ...tempProfile,
                          config: {
                            ...tempProfile.config,
                            run: {
                              ...tempProfile.config.run,
                              before: runCommand
                            } as Run
                          } as Config
                        });
                      }
                    }}
                  />
                }
              />
            </Card>

            <Card
              header="Run After"
              icon={"\uE756"}
              expandable
              disabled={!globalConfig.run_commands}
            >
              <CardItem
                header="Target"
                description="Executable to run after apply"
                control={
                  <div className={styles.fileRow}>
                    <Input
                      className={mergeClasses(styles.input, styles.targetInput)}
                      value={tempProfile?.config?.run?.after?.target || ""}
                      placeholder="Target executable path"
                      contentAfter={
                        <Button
                          icon={"\uE894"}
                          className={styles.clearButton}
                          appearance="transparent"
                          onClick={() => handleClearRunCommand('after', 'target')}
                        />
                      }
                      onChange={(e) => {
                        if (tempProfile?.config) {
                          const runCommand: RunCommand = {
                            target: e.target.value,
                            args: tempProfile.config.run?.after?.args || ''
                          };

                          setTempProfile({
                            ...tempProfile,
                            config: {
                              ...tempProfile.config,
                              run: {
                                ...tempProfile.config.run,
                                after: runCommand
                              } as Run
                            } as Config
                          });
                        }
                      }}
                    />
                    <Button
                      appearance="secondary"
                      className={styles.browseButton}
                      onClick={() => handleFileSelect('after')}
                      icon={"\uE838"}
                    />
                  </div>
                }
              />
              <CardItem
                fullWidthControl
                control={
                  <Textarea
                    className={mergeClasses(styles.input, styles.textArea)}
                    value={tempProfile?.config?.run?.after?.args || ""}
                    placeholder="Command arguments"
                    onChange={(e) => {
                      if (tempProfile?.config) {
                        const runCommand: RunCommand = {
                          target: tempProfile.config.run?.after?.target || '',
                          args: e.target.value
                        };

                        setTempProfile({
                          ...tempProfile,
                          config: {
                            ...tempProfile.config,
                            run: {
                              ...tempProfile.config.run,
                              after: runCommand
                            } as Run
                          } as Config
                        });
                      }
                    }}
                  />
                }
              />
            </Card>
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
              <Dialog>
                <DialogTrigger>
                  <Button
                    className={styles.controlButton}
                    appearance="subtle"
                  >
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogSurface className={styles.deleteDialogSurface}>
                  <DialogBody>
                    <DialogTitle>Delete Profile</DialogTitle>
                    <DialogContent className={styles.deleteDialogContent}>
                      <Text>Are you sure you want to delete this profile?</Text>
                    </DialogContent>
                    <DialogActions>
                      <DialogTrigger disableButtonEnhancement>
                        <Button
                          appearance="primary"
                          onClick={handleDeleteProfile}
                        >
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogTrigger disableButtonEnhancement>
                        <Button
                          appearance="subtle"
                          className={styles.controlButton}
                        >
                          Cancel
                        </Button>
                      </DialogTrigger>
                    </DialogActions>
                  </DialogBody>
                </DialogSurface>
              </Dialog>
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
        <StartupScreen />
      )}
    </div>
  );
};
