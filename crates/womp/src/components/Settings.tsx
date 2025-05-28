import { useGlobalConfigStore } from "@/lib/globalConfig";
import { Button, Label, Link, makeStyles, Switch, SwitchOnChangeData, Text, Title2, tokens } from "@fluentui/react-components";
import { useEffect, useState } from "react";
import { Card, CardItem } from "./Card";
import { Icon } from "./DynamicIcon";
import { ThemeSelect } from "./ThemeSelect";
import { TrayIconSelect } from "./TrayIconSelect";

const useStyles = makeStyles({
  root: {
    display: "flex",
    gap: tokens.spacingVerticalXXXL,
    boxSizing: "border-box",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    padding: tokens.spacingHorizontalXXXL,
    backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.05)",
    borderTopLeftRadius: tokens.borderRadiusLarge,
    overflowY: "auto",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  dependencies: {
    display: "flex",
    flexDirection: "column",
  },
  controlButton: {
    fontWeight: tokens.fontWeightRegular,
    "& > a": {
      color: `var(--colorBrandForeground1) !important`,
    },
    alignSelf: "flex-start",
    marginLeft: "-9px",
    cursor: "pointer !important",
    "&:hover": {
      backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.15)",
      "& > a": {
        color: `var(--colorBrandForeground1) !important`,
        textDecoration: "none !important",
      },
    },
    "& > a:hover": {
      textDecoration: "none !important",
    },
    "&:hover:active": {
      color: tokens.colorNeutralForeground2,
      backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.05)",
      "& > a": {
        color: `var(--colorBrandForeground1) !important`,
        textDecoration: "none !important",
      },
    },
  },
  sourceCode: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  sourceCodeText: {
    fontFamily: tokens.fontFamilyMonospace,
    color: tokens.colorNeutralForeground2,
    transition: "opacity 0.2s ease-in-out",
  },
  sourceCodeCopy: {
    display: "flex",
    flexDirection: "row",
    gap: tokens.spacingHorizontalM,
    alignItems: "center",
  },
  switch: {
    "& > *": {
      cursor: "default !important",
    },
    "&:hover > .fui-Switch__input:not(:checked) ~ .fui-Switch__indicator": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  }
});

enum SourceCodeText {
  Default = "git clone https://github.com/nikolas-sturm/WOMP",
  Copied = "Copied to clipboard...",
}

export function Settings() {
  const classes = useStyles();
  const [justCopied, setJustCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [sourceCodeText, setSourceCodeText] = useState(SourceCodeText.Default);
  const { globalConfig, setGlobalConfig } = useGlobalConfigStore();

  useEffect(() => {
    if (justCopied) {
      setIsVisible(false);
      setTimeout(() => {
        setSourceCodeText(SourceCodeText.Copied);
        setIsVisible(true);
      }, 200);
      const timer = setTimeout(() => {
        setJustCopied(false);
        setIsVisible(false);
        setTimeout(() => {
          setSourceCodeText(SourceCodeText.Default);
          setIsVisible(true);
        }, 200);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [justCopied]);

  const handleOptionToggle = async (event: React.ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => {
    switch (event.target.id) {
      case "save_dpi_scale":
        setGlobalConfig({ ...globalConfig, save_dpi_scale: data.checked });
        break;
      case "autostart":
        setGlobalConfig({ ...globalConfig, autostart: data.checked });
        break;
      case "run_commands":
        setGlobalConfig({ ...globalConfig, run_commands: data.checked });
        break;
      case "save_icon_size":
        setGlobalConfig({ ...globalConfig, save_icon_size: data.checked });
        break;
      case "save_hdr_state":
        if (!data.checked) {
          setGlobalConfig({ ...globalConfig, save_hdr_state: false, save_sdr_white_level: false });
        } else {
          setGlobalConfig({ ...globalConfig, save_hdr_state: data.checked });
        }
        break;
      case "save_sdr_white_level":
        setGlobalConfig({ ...globalConfig, save_sdr_white_level: data.checked });
        break;
      case "save_wallpaper_info":
        setGlobalConfig({ ...globalConfig, save_wallpaper_info: data.checked });
        break;
      case "save_audio_output":
        setGlobalConfig({ ...globalConfig, save_audio_output: data.checked });
        break;
    }
  };

  return (
    <div className={classes.root}>
      <Title2>Settings</Title2>
      <div className={classes.section}>
        <Label>Appearance & behavior</Label>
        <Card
          header="App theme"
          icon={"\uE790"}
          control={<ThemeSelect />}
          description="Select which app theme to display"
        />
        <Card
          header="Tray icon"
          control={<TrayIconSelect />}
          description="Select which tray icon to display"
        />
        <Card
          header="Run at startup"
          control={
            <Switch
              className={classes.switch}
              id="autostart"
              checked={globalConfig.autostart}
              onChange={handleOptionToggle}
              label={globalConfig.autostart ? "On" : "Off"}
              labelPosition="before"
            />
          }
          description="WOMP will launch automatically"
        />
        <Card
          header="Run commands"
          icon={"\uE756"}
          control={
            <Switch
              className={classes.switch}
              id="run_commands"
              checked={globalConfig.run_commands}
              onChange={handleOptionToggle}
              label={globalConfig.run_commands ? "On" : "Off"}
              labelPosition="before"
            />
          }
          description="Run before/after commands defined in profile config"
        />
      </div>
      <div className={classes.section}>
        <Label>Experimental settings</Label>
        <Card
          header="Save DPI/Display Scale"
          icon={"\uE58E"}
          control={
            <Switch
              id="save_dpi_scale"
              className={classes.switch}
              checked={globalConfig.save_dpi_scale}
              onChange={handleOptionToggle}
              label={globalConfig.save_dpi_scale ? "On" : "Off"}
              labelPosition="before"
            />
          }
          description="Store the display zoom percentage for each profile"
        />
        <Card
          header="Save Desktop Icon Size"
          icon={"\uE8A9"}
          control={
            <Switch
              id="save_icon_size"
              className={classes.switch}
              checked={globalConfig.save_icon_size}
              onChange={handleOptionToggle}
              label={globalConfig.save_icon_size ? "On" : "Off"}
              labelPosition="before"
            />
          }
          description="Store the desktop icon size for each profile"
        />
        <Card
          header="Save Wallpaper Info"
          icon={"\uE91B"}
          control={
            <Switch
              id="save_wallpaper_info"
              className={classes.switch}
              checked={globalConfig.save_wallpaper_info}
              onChange={handleOptionToggle}
              label={globalConfig.save_wallpaper_info ? "On" : "Off"}
              labelPosition="before"
            />
          }
          description="Store the wallpaper image and fit for each profile"
        />
        <Card
          header="Save HDR State"
          icon={"\uEA7F"}
          expandable
          control={
            <Switch
              id="save_hdr_state"
              className={classes.switch}
              checked={globalConfig.save_hdr_state}
              onChange={handleOptionToggle}
              label={globalConfig.save_hdr_state ? "On" : "Off"}
              labelPosition="before"
            />
          }
          description="Store the display HDR state for each profile"
        >
          <CardItem
            header="Save SDR White Level"
            disabled={!globalConfig.save_hdr_state}
            control={
              <Switch
                id="save_sdr_white_level"
                className={classes.switch}
                checked={globalConfig.save_sdr_white_level}
                onChange={handleOptionToggle}
                label={globalConfig.save_sdr_white_level ? "On" : "Off"}
                labelPosition="before"
              />
            }
            description="Store the display SDR white level for each profile"
          />
        </Card>
        <Card
          header="Save Audio Output"
          icon={"\uE767"}
          control={
            <Switch
              id="save_audio_output"
              className={classes.switch}
              checked={globalConfig.save_audio_output}
              onChange={handleOptionToggle}
              label={globalConfig.save_audio_output ? "On" : "Off"}
              labelPosition="before"
            />
          }
          description="Store the default audio output for each profile"
        />
      </div>
      <div className={classes.section}>
        <Label>About</Label>
        <Card
          header="WOMP Config UI"
          iconImage={"/32x32.png"}
          control="1.0.0"
          description="© 2025 Nikolas Sturm"
          expandable
        >
          <div className={classes.sourceCode} onClick={() => {
            navigator.clipboard.writeText("git clone https://github.com/nikolas-sturm/WOMP");
            setJustCopied(true);
          }}>
            <Label>To clone this repository</Label>
            <div className={classes.sourceCodeCopy}>
              <Label className={classes.sourceCodeText} style={{ opacity: isVisible ? 1 : 0 }}>
                {sourceCodeText}
              </Label>
              <Icon icon={"\uE8C8"} />
            </div>
          </div>
          <div className={classes.sourceCode} onClick={() => {
            window.open("https://github.com/nikolas-sturm/WOMP/issues", "_blank");
          }}>
            <Label>Report an issue</Label>
            <Icon icon={"\uE8A7"} />
          </div>
          <div className={classes.dependencies}>
            <Label>Dependencies & references</Label>
            <Button appearance="subtle" size="small" className={classes.controlButton}>
              <Link href="https://sourceforge.net/projects/monitorswitcher/">Monitor Profile Switcher</Link>
            </Button>
            <Button appearance="subtle" size="small" className={classes.controlButton}>
              <Link href="https://github.com/tauri-apps/tauri">Tauri</Link>
            </Button>
            <Button appearance="subtle" size="small" className={classes.controlButton}>
              <Link href="https://github.com/microsoft/windows-rs">Rust for Windows</Link>
            </Button>
            <Button appearance="subtle" size="small" className={classes.controlButton}>
              <Link href="https://github.com/microsoft/fluentui">Fluent UI React Components</Link>
            </Button>
            <Button appearance="subtle" size="small" className={classes.controlButton}>
              <Link href="https://github.com/missive/emoji-mart">Emoji Mart</Link>
            </Button>
          </div>
          <div>
            <Text>THIS CODE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A PARTICULAR PURPOSE.</Text>
          </div>
        </Card>
      </div >
    </div >
  );
}
