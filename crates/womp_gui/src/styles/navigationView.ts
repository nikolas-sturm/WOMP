import { makeStyles, tokens } from "@fluentui/react-components";

export const useNavigationViewStyles = makeStyles({
  navPane: {
    display: "flex",
    flexDirection: "column",
    padding: "0 5px",
    gap: "5px",
    flexShrink: 0,
    height: "100%",
    zIndex: 100,
    transition: "width 0.2s ease-in-out, background-color 0.2s ease-in-out",
  },
  collapsed: {
    width: "50px",
    overflowX: "hidden",
  },
  expanded: {
    width: "320px",
  },
  overlay: {
    position: "absolute",
    left: "0",
    top: "0",
    paddingTop: "50px",
    zIndex: 200,
  },
  overlayExpanded: {
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  placeholder: {
    width: "50px",
    height: "100%",
    flexShrink: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
  },
  profileList: {
    flexGrow: 1,
    overflowY: "auto",
  },
  navItems: {
    display: "flex",
    flexDirection: "column",
    paddingTop: tokens.spacingVerticalM,
    width: "100%",
  },
  section: {
    marginBottom: tokens.spacingVerticalL,
  },
  sectionTitle: {
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalS,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  footer: {
    marginTop: "auto",
    paddingBottom: tokens.spacingVerticalL,
  },
  tabList: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    width: "100%",
    height: "100%",
  },
  tab: {
    display: "flex",
    justifyContent: "flex-start",
    textWrapMode: "nowrap",
    height: "36px",
    "&:hover, &:focus, &[aria-selected=true]": {
      backgroundColor:
        "rgb(from var(--colorNeutralForeground1) r g b / 0.1) !important",
    },
    "&:hover:focus": {
      backgroundColor:
        "rgb(from var(--colorNeutralForeground1) r g b / 0.05) !important",
    },
    "& > .fui-Tab__icon": {
      fontSize: "16px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      color: tokens.colorNeutralForeground2,
    },
    "&:enabled, &:enabled:hover": {
      "& > .fui-Tab__icon": {
        color: `${tokens.colorNeutralForeground2} !important`,
      },
    },
    "& > .fui-Tab__content--reserved-space": {
      display: "none",
    },
    "&:hover::before, &:focus::before": {
      display: "none",
    },
  },
  headerButton: {
    width: "40px",
    height: "34px",
    maxWidth: "40px",
    minWidth: "40px",
  },
  headerButtonAnimated: {
    "&:hover": {
      backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.1)",
    },
    "&:active > span": {
      transform: "scaleX(0.5)",
    },
  },
  headerButtonIcon: {
    position: "relative",
    top: "3px",
    transition: "transform 0.1s ease-in-out",
  },
  sideButton: {
    width: "100%",
    height: "34px",
    maxWidth: "none",
  },
  search: {
    display: "flex",
    justifyContent: "flex-start",
    position: "relative",
    width: "100%",
  },
  searchInput: {
    width: "100%",
    height: "34px",
    borderLeft: "none",
    borderRight: "none",
    borderTop: "none",
    backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.05)",
  },
  searchInputButton: {
    position: "absolute",
    fontSize: "12px",
    width: "30px",
    height: "24px",
    borderRadius: tokens.borderRadiusMedium,
    margin: "5px 0",
    right: "5px",
    zIndex: 100,
    "&:hover": {
      backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.1)",
    },
  },
  searchButton: {
    width: "100%",
  },
  settingsTab: {
    marginTop: "auto",
    bottom: "5px",
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
  saveDialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  saveDialogSurface: {
    width: "fit-content",
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