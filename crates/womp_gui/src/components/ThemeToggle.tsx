import { useThemeStore } from "@/lib/themeStore";
import { Button, makeStyles } from "@fluentui/react-components";
const useStyles = makeStyles({
  button: {
    textAlign: "center",
    verticalAlign: "middle",
    bottom: "5px",
    left: "5px",
    zIndex: 1000,
    "&:hover": {
      backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.1)",
    },
  },
  buttonIcon: {
    position: "relative",
    top: "2px",
  },
});

export function ThemeToggle() {
  const { activeTheme, toggleTheme } = useThemeStore();

  const classes = useStyles();

  return (
    <Button
      onClick={toggleTheme}
      className={classes.button}
      appearance="subtle"
    >
      <span className={classes.buttonIcon}>
        {activeTheme === "dark" ? "\uE706" : "\uE708"}
      </span>
    </Button>
  );
}
