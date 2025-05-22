import { Icon } from "@/components/DynamicIcon";
import { useProfileStore } from "@/lib/profileStore";
import { useNavigationViewStyles } from "@/styles/navigationView";
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
  Label,
  Tab,
  TabList,
  mergeClasses,
  useId,
  type DialogOpenChangeData,
  type DialogOpenChangeEvent,
} from "@fluentui/react-components";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from "react";
import sanitize from "sanitize-filename";
import { ProfileName } from "./ProfileName";

export const NavigationView = () => {
  const styles = useNavigationViewStyles();
  const [isExpanded, setIsExpanded] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState("");
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);
  const [saveDialogInput, setSaveDialogInput] = useState("");
  const { profiles, selectedProfile, setSelectedProfile, updateProfiles } =
    useProfileStore();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [profileExistsDialogOpen, setProfileExistsDialogOpen] = useState(false);
  const overwriteConfirmedRef = useRef(false);

  // Filter profiles based on search input
  const filteredProfiles =
    searchInput.trim() === ""
      ? profiles
      : profiles.filter(
        (profile) =>
          profile.name.toLowerCase().includes(searchInput.toLowerCase()) ||
          (profile.config?.name
            ? profile.config.name
              .toLowerCase()
              .includes(searchInput.toLowerCase())
            : false),
      );

  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleTabSelect = useCallback(
    (key: string) => {
      if (key === "settings") {
        setSelectedProfile("settings");
      } else {
        setSelectedProfile(
          profiles.find((profile) => profile.name === key) ?? null,
        );
      }
    },
    [profiles, setSelectedProfile],
  );

  const handleSearch = useCallback(() => {
    setIsExpanded(true);
    setShouldFocusSearch(true);
  }, []);

  const refreshProfiles = useCallback(() => {
    updateProfiles();
  }, [updateProfiles]);

  const handleSaveCurrentProfile = useCallback(
    async (profileName: string, overwrite: boolean = false) => {
      const cleanedProfileName = sanitize(profileName.toLowerCase().replace(/-/g, "_"));
      if (cleanedProfileName.length === 0) {
        return;
      }
      // Check if the profile already exists ask if they want to overwrite
      const profileExists = profiles.find(
        (profile) => profile.name === cleanedProfileName,
      );
      if (profileExists && !overwrite) {
        setProfileExistsDialogOpen(true);
        return;
      }
      await invoke("save_current_display_layout", {
        profileName: cleanedProfileName,
      });
      const newProfiles = await updateProfiles();
      setSelectedProfile(
        newProfiles.find((profile) => profile.name === profileName) ?? null,
      );
      setSaveDialogInput("");
      setSaveDialogOpen(false);
    },
    [profiles, updateProfiles, setSelectedProfile],
  );

  const handleProfileExistsDialogOpenChange = useCallback(
    (_: DialogOpenChangeEvent, data: DialogOpenChangeData) => {
      setProfileExistsDialogOpen(data.open);
      // open save dialog if the profile exists dialog is closed NOT by clicking save button
      if (!data.open && !overwriteConfirmedRef.current) {
        setSaveDialogOpen(true);
      }
      // Reset the ref for next time
      if (!data.open) {
        overwriteConfirmedRef.current = false;
      }
    },
    [],
  );

  // Effect to focus search input after expansion
  useEffect(() => {
    if (isExpanded && shouldFocusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
      setShouldFocusSearch(false);
    }
  }, [isExpanded, shouldFocusSearch]);

  const paneClassName = isExpanded ? styles.expanded : styles.collapsed;

  const titleId = useId("nav-title");

  return (
    <div className={`${styles.navPane} ${paneClassName}`}>
      <div className={styles.header}>
        <Button
          appearance="subtle"
          className={styles.headerButton}
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-controls={titleId}
        >
          <span className={styles.headerButtonIcon}>&#xE700;</span>
        </Button>
        {isExpanded && (
          <>
            <Dialog
              open={saveDialogOpen}
              onOpenChange={(_, data) => setSaveDialogOpen(data.open)}
            >
              <DialogTrigger disableButtonEnhancement>
                <Button
                  appearance="subtle"
                  className={styles.headerButton}
                >
                  <span className={styles.headerButtonIcon}>&#xE710;</span>
                </Button>
              </DialogTrigger>
              <DialogSurface className={styles.saveDialogSurface}>
                <DialogBody>
                  <DialogTitle>Save Current Profile</DialogTitle>
                  <DialogContent className={styles.saveDialogContent}>
                    <Label>Folder Name</Label>
                    <Input
                      className={styles.input}
                      placeholder="some_profile_name"
                      value={saveDialogInput}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveCurrentProfile(saveDialogInput);
                        }
                      }}
                      onChange={(_, data) => setSaveDialogInput(data.value)}
                    />
                  </DialogContent>
                  <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                      <Button
                        appearance="subtle"
                        className={styles.controlButton}
                      >
                        Cancel
                      </Button>
                    </DialogTrigger>
                    <DialogTrigger disableButtonEnhancement>
                      <Button
                        appearance="primary"
                        onClick={() =>
                          handleSaveCurrentProfile(saveDialogInput)
                        }
                      >
                        Save
                      </Button>
                    </DialogTrigger>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
            <Button
              appearance="subtle"
              className={styles.headerButton}
              onClick={refreshProfiles}
              aria-expanded={isExpanded}
              aria-controls={titleId}
            >
              <span className={styles.headerButtonIcon}>&#xE72C;</span>
            </Button>
          </>
        )}
      </div>
      <div className={styles.search}>
        {isExpanded ? (
          <>
            <Input
              className={styles.searchInput}
              placeholder="Search"
              type="search"
              value={searchInput}
              onChange={(_, data) => setSearchInput(data.value)}
              ref={searchInputRef}
            />
            <Button appearance="subtle" className={styles.searchInputButton}>
              &#xE721;
            </Button>
          </>
        ) : (
          <div className={styles.searchButton}>
            <Button
              appearance="subtle"
              className={styles.headerButton}
              onClick={handleSearch}
            >
              <span className={styles.headerButtonIcon}>&#xE721;</span>
            </Button>
          </div>
        )}
      </div>
      <div className={styles.profileList}>
        <TabList
          className={styles.tabList}
          vertical
          selectedValue={
            selectedProfile === "settings"
              ? "settings"
              : (selectedProfile?.name ?? "")
          }
          onTabSelect={(_, data) => handleTabSelect(data.value as string)}
        >
          {filteredProfiles.map((profile) => (
            <Tab
              key={profile.name}
              value={profile.name}
              className={styles.tab}
              icon={{
                children: <Icon icon={profile.config?.icon ?? "\uE835"} />,
              }}
            >
              {isExpanded ? <ProfileName profile={profile} /> : null}
            </Tab>
          ))}
          <Tab
            key="settings"
            value="settings"
            className={mergeClasses(styles.tab, styles.settingsTab)}
            icon={{ children: <Icon icon={"\uE713"} /> }}
          >
            {isExpanded ? "Settings" : null}
          </Tab>
        </TabList>
      </div>
      <Dialog
        open={profileExistsDialogOpen}
        onOpenChange={handleProfileExistsDialogOpenChange}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Profile already exists</DialogTitle>
            <DialogContent>
              <Label>
                The profile <b>{saveDialogInput}</b> already exists. Do you want
                to overwrite it?
              </Label>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="subtle">Cancel</Button>
              </DialogTrigger>
              <DialogTrigger disableButtonEnhancement>
                <Button
                  appearance="primary"
                  onClick={() => {
                    overwriteConfirmedRef.current = true;
                    handleSaveCurrentProfile(saveDialogInput, true);
                    setProfileExistsDialogOpen(false);
                  }}
                >
                  Overwrite
                </Button>
              </DialogTrigger>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
