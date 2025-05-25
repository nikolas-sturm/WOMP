import { ThemeOption } from "@/lib/globalConfig";
import { useThemeStore } from "@/lib/themeStore";
import { makeStyles, Select, SelectOnChangeData } from "@fluentui/react-components";
import React from "react";

const useStyles = makeStyles({
  select: {
    minWidth: "100px",
    "& > select": {
      backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.05)",
    },
  },
  option: {
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2)",
    },
  },
});

export function ThemeSelect() {
  const { activeTheme, setTheme } = useThemeStore();

  const classes = useStyles();

  const handleThemeChange = (_: React.FormEvent<HTMLElement>, data: SelectOnChangeData) => {
    if (data.value) {
      setTheme(data.value as ThemeOption);
    }
  };

  return (
    <Select
      value={activeTheme}
      appearance="filled-lighter"
      onChange={handleThemeChange}
      className={classes.select}
    >
      <option value="system" className={classes.option}>System</option>
      <option value="light" className={classes.option}>Light</option>
      <option value="dark" className={classes.option}>Dark</option>
    </Select>
  );
}
