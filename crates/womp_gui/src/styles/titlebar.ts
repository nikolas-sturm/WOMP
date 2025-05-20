import { makeStyles, tokens } from "@fluentui/react-components";

export const useTitlebarStyles = makeStyles({
  titlebar: {
    position: "fixed",
    boxSizing: "border-box",
    top: "1px",
    left: "1px",
    width: "calc(100% - 1px)",
    height: "50px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    WebkitAppRegion: "drag", // This makes the titlebar draggable
    zIndex: 100,
  },
  title: {
    padding: "20px 16px",
    marginLeft: "0px",
    fontSize: "12px",
    flexGrow: 1,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    cursor: "default !important",
  },
  windowControls: {
    display: "flex",
    height: "100%",
    position: "absolute",
    marginTop: "-1px",
    top: 0,
    right: 0,
    WebkitAppRegion: "no-drag", // Prevent drag behavior on control buttons
    zIndex: 3000,
  },
  controlButton: {
    width: "46px",
    height: "100%",
    fontSize: "10px",
    borderRadius: 0,
    color: tokens.colorNeutralForeground1,
    "&:hover": {
      backgroundColor: tokens.colorNeutralStencil2Alpha,
      color: tokens.colorNeutralForeground1,
    },
    "&:hover:active": {
      backgroundColor: tokens.colorNeutralBackgroundAlpha2,
      color: tokens.colorNeutralForeground1,
    },
  },
  closeButton: {
    "&:hover": {
      backgroundColor: "#E81123",
    },
    "&:hover:active": {
      backgroundColor: "#f35966",
      color: tokens.colorNeutralBackground1,
    },
  },
  titleIcon: {
    fontSize: "16px",
    verticalAlign: "middle",
  },
});
