import type { Profile } from "@/lib/types";
import {
  Text,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  title: {
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalL,
    textWrapMode: "nowrap !important",
  },
  profileName: {
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground2,
  },
});

export const ProfileName = ({
  profile,
  className,
}: { profile: Profile; className?: string }) => {
  const styles = useStyles();

  if (profile.config) {
    return (
      <Text className={mergeClasses(styles.title, className)}>
        {profile.config.name}{" "}
        <span className={styles.profileName}>({profile.name})</span>
      </Text>
    );
  }

  return (
    <Text className={mergeClasses(styles.title, className)}>
      {profile.name}
    </Text>
  );
};
