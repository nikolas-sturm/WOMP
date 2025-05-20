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
      start: 0xe700,
      end: 0xe900,
    },
    {
      start: 0xea00,
      end: 0xec00,
    },
    {
      start: 0xed00,
      end: 0xef00,
    },
    {
      start: 0xf000,
      end: 0xf200,
    },
    {
      start: 0xf300,
      end: 0xf500,
    },
    {
      start: 0xf600,
      end: 0xf800,
    },
  ];

  if (
    FLUENT_PUA_RANGES.some(
      (range) => charCode >= range.start && charCode <= range.end,
    )
  ) {
    return <span className={styles.fluentIcon}>{icon}</span>;
  }

  return <span>{icon}</span>;
};
