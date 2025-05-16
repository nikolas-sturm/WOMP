import { Icon } from "@/components/DynamicIcon";
import { useProfileStore } from "@/lib/profileStore";
import {
  Button,
  Input,
  makeStyles,
  shorthands,
  Tab,
  TabList,
  tokens,
  useId,
} from "@fluentui/react-components";
import React, { useCallback, useEffect, useRef, useState } from "react";

const useStyles = makeStyles({
  navPane: {
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    height: "100%",
    zIndex: 100,
    transition: "width 0.2s ease-in-out",
  },
  collapsed: {
    width: "50px",
    overflowX: "hidden",
  },
  expanded: {
    width: "320px",
  },
  header: {
    display: "flex",
    width: "100%",
  },
  content: {
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
    ...shorthands.gap("2px"),
    width: "100%",
  },
  tab: {
    display: "flex",
    justifyContent: "flex-start",
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    height: "36px",
    "& > .fui-Tab__icon": {
      fontSize: "16px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: tokens.colorNeutralForeground2,
    },
  },
  headerButton: {
    width: "40px",
    height: "34px",
    maxWidth: "40px",
    minWidth: "40px",
    margin: "0 5px 5px 5px",
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
  },
  searchInput: {
    width: "100%",
    height: "34px",
    margin: "0 5px 5px 5px",
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
    right: "12px",
    zIndex: 100,
    "&:hover": {
      backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.1)",
    },
  },
  searchButton: {
    width: "100%",
    height: "34px",
  },
});

export interface NavigationViewProps {
  selectedKey: string;
  onSelectedKeyChange?: (key: string) => void;
  alwaysExpanded?: boolean;
}

export const NavigationView: React.FC<NavigationViewProps> = ({
  selectedKey,
  onSelectedKeyChange,
  alwaysExpanded = false,
}) => {
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState("");
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);

  const { profiles } = useProfileStore();
  
  const toggleExpanded = useCallback(() => {
    if (!alwaysExpanded) {
      setIsExpanded(!isExpanded);
    }
  }, [isExpanded, alwaysExpanded]);

  const handleTabSelect = useCallback(
    (key: string) => {
      onSelectedKeyChange?.(key);
    },
    [onSelectedKeyChange]
  );

  const handleSearch = useCallback(() => {
    if (!alwaysExpanded) {
      setIsExpanded(true);
      setShouldFocusSearch(true);
    }
  }, [alwaysExpanded]);

  // Effect to focus search input after expansion
  useEffect(() => {
    if ((isExpanded || alwaysExpanded) && shouldFocusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
      setShouldFocusSearch(false);
    }
  }, [isExpanded, alwaysExpanded, shouldFocusSearch]);

  const paneClassName = alwaysExpanded || isExpanded 
    ? styles.expanded 
    : styles.collapsed;

  const titleId = useId("nav-title");

  return (
    <div className={`${styles.navPane} ${paneClassName}`}>
      <div className={styles.header}>
        <Button
          appearance="subtle"
          className={styles.headerButton}
          onClick={toggleExpanded}
          aria-expanded={isExpanded || alwaysExpanded}
          aria-controls={titleId}
        ><span className={styles.headerButtonIcon}>&#xE700;</span></Button>
      </div>
      <div className={styles.search}>
        {(isExpanded || alwaysExpanded) ? (
          <>
            <Input 
              className={styles.searchInput} 
              placeholder="Search"
              type="search"
              value={searchInput} 
              onChange={(_, data) => setSearchInput(data.value)} 
            ref={searchInputRef} 
            />
            <Button appearance="subtle" className={styles.searchInputButton} >
              &#xE721;
            </Button>
          </>
        ) : (
          <div className={styles.searchButton}>
            <Button appearance="subtle" className={styles.headerButton} onClick={handleSearch}>
              <span className={styles.headerButtonIcon}>&#xE721;</span>
            </Button>
          </div>
        )}
      </div>
      <div className={styles.content}>
        <TabList
          className={styles.tabList}
          vertical
          selectedValue={selectedKey}
          onTabSelect={(_, data) => handleTabSelect(data.value as string)}
        >
          {profiles.map((profile) => (
            <Tab
              key={profile.name}
              value={profile.name}
              className={styles.tab}
              icon={{
                children: <Icon icon={profile.config?.icon ?? "\uE835"} /> 
              }}
            >
              {(isExpanded || alwaysExpanded) ? profile.config ? `${profile.config.name} (${profile.name})` : profile.name : null}
            </Tab>
          ))}
        </TabList>
      </div>
    </div>
  );
};
