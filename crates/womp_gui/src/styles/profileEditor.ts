import { makeStyles, tokens } from "@fluentui/react-components";

export const useProfileEditorStyles = makeStyles({
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
  nameInput: {
    "& > input": {
      color: "var(--colorNeutralForeground1) !important",
    },
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalXXXL,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalM,
  },
  fieldContainer: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalM,
  },
  flexGrow: {
    flexGrow: 1,
  },
  nameAndIconContainer: {
    display: "flex",
    flexDirection: "row",
    gap: tokens.spacingHorizontalM,
  },
  iconCombobox: {
    minWidth: 0,
    width: "unset !important",
  },
  segoeIcon: {
    fontFamily: "'Segoe Fluent Icons', 'Segoe MDL2 Assets', 'Segoe UI Symbol'",
    fontSize: "20px",
  },
  emoji: {
    fontSize: "20px",
  },
  emojiPicker: {
    padding: 0,
    border: "none",
    backgroundColor: "transparent",
  },
  emojiButton: {
    width: "32px",
    height: "32px",
    padding: 0,
    minWidth: 0,
  },
  editorContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    maxWidth: "1000px",
    margin: "0 auto",
    overflowY: "hidden",
  },
  fieldsContainer: {
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    overflowX: "hidden",
  },
  controlsContainer: {
    display: "flex",
    flexDirection: "column",
    marginTop: "auto",
    maxWidth: "600px",
    width: "100%",
    margin: "auto auto 0 auto",
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalS,
  },
  controlsSection: {
    display: "flex",
    flexDirection: "row",
    gap: tokens.spacingHorizontalS,
  },
  controlButton: {
    flex: "1 1 0",
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
  saveButton: {
    flex: "1 1 0",
    fontWeight: tokens.fontWeightRegular,
    "&:hover:active": {
      color: tokens.colorNeutralForegroundInverted,
    },
  },
  deleteDialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  deleteDialogSurface: {
    width: "fit-content",
  },
});