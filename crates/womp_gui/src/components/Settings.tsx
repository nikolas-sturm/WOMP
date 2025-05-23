import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, Label, Link, makeStyles, Text, Title2, tokens } from "@fluentui/react-components";
import { useEffect, useState } from "react";
import { Icon } from "./DynamicIcon";
import { SettingsCard } from "./SettingsCard";

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

  return (
    <div className={classes.root}>
      <Title2>Settings</Title2>
      <div className={classes.section}>
        <Label>Appearance & behavior</Label>
        <SettingsCard
          header="App theme"
          icon={"\uE790"}
          control={<ThemeToggle />}
          description="Select which app theme to display"
        />
      </div>
      <div className={classes.section}>
        <Label>About</Label>
        <SettingsCard
          header="WOMP Config UI"
          icon={"\uE7F4"}
          control="1.0.0"
          description="© 2025 Nikolas Sturm. All rights reserved."
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
        </SettingsCard>
      </div >
    </div >
  );
}
