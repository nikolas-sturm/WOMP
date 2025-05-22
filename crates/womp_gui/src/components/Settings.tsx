import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, Label, Link, makeStyles, Title2, tokens } from "@fluentui/react-components";
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
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  dependencies: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  controlButton: {
    fontWeight: tokens.fontWeightRegular,
    "& > a": {
      color: `var(--colorBrandForeground1) !important`,
    },
    alignSelf: "flex-start",
    marginLeft: "-8px",
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
});

export function Settings() {
  const classes = useStyles();

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
          <div className={classes.dependencies}>
            Dependencies & references
            <Button appearance="subtle" size="small" className={classes.controlButton}>
              <Link href="https://github.com/nikolasturm/womp">WOMP</Link>
            </Button>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
