import { useGlobalConfigStore } from "@/lib/globalConfig";
import {
  Button,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import { Icon } from "./DynamicIcon";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "row",
    gap: tokens.spacingHorizontalS,
  },
  button: {
    flex: "1 1 0",
    maxWidth: "48px",
    width: "48px",
    height: "48px",
    padding: 0,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground1,
    backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.1)",
    "&:hover": {
      backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.15)",
    },
    "&:hover:active": {
      color: tokens.colorNeutralForeground2,
      backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.05)",
    },
    "& > span": {
      width: "32px",
      height: "32px",
    },
  },
  buttonActive: {
    backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.25)",
    "&:hover": {
      backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.3)",
    },
    "&:hover:active": {
      backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.35)",
    },
  },
  icon: {
    paddingTop: "6px",
    fontSize: "32px",
  },
  imgIcon: {
    width: "32px",
    height: "32px",
  },
});

export function TrayIconSelect() {
  const classes = useStyles();

  const { globalConfig, setGlobalConfig } = useGlobalConfigStore();

  const handleTrayIconChange = (icon: string) => {
    setGlobalConfig({ ...globalConfig, tray_icon: icon });
  };

  return (
    <div className={classes.root}>
      <Button
        icon={<img src="/32x32.png" className={classes.imgIcon} />}
        className={mergeClasses(
          classes.button,
          globalConfig.tray_icon === "womp" && classes.buttonActive,
        )}
        onClick={() => handleTrayIconChange("womp")}
      />
      <Button
        icon={<Icon icon={"\uE7F4"} className={classes.icon} />}
        className={mergeClasses(
          classes.button,
          globalConfig.tray_icon === "display" && classes.buttonActive,
        )}
        onClick={() => handleTrayIconChange("display")}
      />
      <Button
        icon={<Icon icon={"\uEBC6"} className={classes.icon} />}
        className={mergeClasses(
          classes.button,
          globalConfig.tray_icon === "dual" && classes.buttonActive,
        )}
        onClick={() => handleTrayIconChange("dual")}
      />
    </div>
  );
}
