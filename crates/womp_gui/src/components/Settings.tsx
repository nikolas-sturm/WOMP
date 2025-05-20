import { ThemeToggle } from "@/components/ThemeToggle";
import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    display: "flex",
    boxSizing: "border-box",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    padding: tokens.spacingHorizontalXXXL,
    backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.05)",
    borderTopLeftRadius: tokens.borderRadiusLarge,
  },
});

export function Settings() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <ThemeToggle />
    </div>
  );
}
