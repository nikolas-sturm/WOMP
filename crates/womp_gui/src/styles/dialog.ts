import { makeStyles, tokens } from "@fluentui/react-components";

export const useDialogStyles = makeStyles({
  root: {
    height: "calc(100vh - 50px)",
    width: "100vw",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "50px",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    justifyContent: "space-between",
    paddingLeft: tokens.spacingVerticalL,
    paddingRight: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    height: "100%",
    width: "100%",
  },
  buttonContainer: {
    display: "flex",
    gap: tokens.spacingVerticalS,
    justifyContent: "flex-end",
  },
  controlButton: {
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
  },
  input: {
    borderLeft: "none",
    borderRight: "none",
    borderTop: "none",
    borderBottom: "1px solid var(--colorNeutralStrokeAccessible)",
    backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.05)",
    "&:hover, &:focus-within, &:active": {
      borderTop: "none !important",
      borderLeft: "none !important",
      borderRight: "none !important",
    },
  },
});