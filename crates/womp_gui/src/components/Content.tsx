import { makeStyles, Text, tokens } from "@fluentui/react-components";
import React from "react";

const useStyles = makeStyles({
  root: {
    display: "flex",
    boxSizing: "border-box",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    padding: tokens.spacingHorizontalL,
    backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.05)",
    borderTopLeftRadius: tokens.borderRadiusLarge,
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalL,
  },
});

export const Content: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <Text className={styles.title}>Welcome to WOMP</Text>
      <Text>Select an item from the navigation menu to get started.</Text>
    </div>
  );
};

export default Content; 