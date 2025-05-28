import { useThemeStore } from "@/lib/themeStore";
import { Text, Title1, makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    display: "flex",
    height: "100%",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXXL,
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    width: "100%",
    height: "auto",
  },
});

export function StartupScreen() {
  const classes = useStyles();

  const { getActiveThemeName } = useThemeStore();

  const activeTheme = getActiveThemeName();

  return (
    <div className={classes.root}>
      <img src={activeTheme === "dark" ? "/banner_white.png" : "/banner_dark.png"} alt="WOMP" className={classes.banner} />
      <Title1>Windows Output Manager Protocol</Title1>
      <Text>Select an profile from the navigation menu to get started.</Text>
    </div>
  );
}