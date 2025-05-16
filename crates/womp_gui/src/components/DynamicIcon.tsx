import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  fluentIcon: {
    paddingTop: "3px",
  },
});

export const Icon = ({ icon }: { icon: string }) => {
  const charCode = icon.charCodeAt(0);

  const styles = useStyles();

  const FLUENT_PUA_RANGES = [
    {
      start: 0xE700,
      end: 0xE900,
    },
    {
      start: 0xEA00,
      end: 0xEC00,
    },
    {
      start: 0xED00,
      end: 0xEF00,
    },
    {
      start: 0xF000,
      end: 0xF200,
    },
    {
      start: 0xF300,
      end: 0xF500,
    },
    {
      start: 0xF600,
      end: 0xF800,
    }
  ]

  if (FLUENT_PUA_RANGES.some((range) => charCode >= range.start && charCode <= range.end)) {
    return <span className={styles.fluentIcon}>{icon}</span>;
  }

  return <span>{icon}</span>;
};