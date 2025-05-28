import {
  Button,
  CardHeader,
  Card as FluentCard,
  makeStyles,
  mergeClasses,
  Text,
  tokens,
} from '@fluentui/react-components';
import { ChevronUpRegular } from '@fluentui/react-icons';
import React, { ReactNode, useState } from 'react';
import { Icon } from './DynamicIcon';

interface CardProps {
  /** Optional icon to display on the left of the header. Recommended size: 24x24 or 32x32. */
  icon?: string;
  /** Optional url to image to display on the left of the header. Recommended size: 24x24 or 32x32. */
  iconImage?: string;
  /** The main title text for the card. */
  header: string;
  /** Optional description text displayed below the header. */
  description?: string;
  /** Optional control element (e.g., Switch, Dropdown, Button group) to display on the right side of the header row. */
  control?: ReactNode;
  /** Determines if the card has an expandable section. Defaults to false. */
  expandable?: boolean;
  /** If expandable, determines if the card is initially expanded. Defaults to false. */
  initiallyExpanded?: boolean;
  /** Content to display in the expandable section of the card. Only shown if `expandable` is true and the card is expanded. */
  children?: ReactNode;
  /** Callback function triggered when the card's expansion state changes. */
  onExpandedChange?: (isExpanded: boolean) => void;
  /** Should the card be disabled? */
  disabled?: boolean;
}

interface CardItemProps {
  /** The main title text for the item. */
  header?: string;
  /** Optional description text displayed below the header. */
  description?: string;
  /** Optional control element (e.g., Switch, Dropdown, Button group) to display on the right side of the item. */
  control?: ReactNode;
  /** Should the item be disabled? */
  disabled?: boolean;
  /** Optional onClick handler for the item */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** Should the control be full width? */
  fullWidthControl?: boolean;
}

const useStyles = makeStyles({
  card: {
    width: '100%',
    flexShrink: 0,
    // Example: maxWidth: '700px', // Adjust as needed
    backgroundColor: "rgb(from var(--colorNeutralForeground1) r g b / 0.05)",
    boxShadow: "none",
    border: "1px solid var(--colorNeutralShadowKey)",
    borderRadius: tokens.borderRadiusLarge,
    padding: 0,
    gap: 0,
    overflow: 'hidden', // Add overflow hidden to contain animations
  },
  cardHeader: {
    padding: tokens.spacingHorizontalL,
    "&:hover": {
      backgroundColor: "var(--hoverBackground)",
    },
  },
  // Styles for the main row of the card header, containing icon, text, and actions
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  headerTextContent: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  headerActionContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS, // 8px gap between control and expand button
  },
  // Styles for the content area that appears when the card is expanded
  expandedContent: {
    padding: 0,
    flexShrink: 0,
    transition: 'max-height 0.3s ease',
    maxHeight: '1000px',
    overflow: 'hidden',
  },
  collapsedContent: {
    maxHeight: '0',
    padding: 0,
    overflow: 'hidden',
    borderTop: "1px solid var(--colorNeutralBackground1)",
    transition: 'max-height 0.3s ease',
  },
  contentWrapper: {
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    borderTop: "1px solid var(--colorNeutralBackground1)",
    transition: 'transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease',
    "&:hover": {
      backgroundColor: "var(--hoverBackground)",
    },
  },
  icon: {
    marginRight: tokens.spacingHorizontalL,
    fontSize: tokens.fontSizeBase500,
    width: "24px",
    height: "24px",
  },
  chevronIcon: {
    transition: 'transform 0.2s ease',
    color: tokens.colorNeutralForeground1,
  },
  rotated: {
    transform: 'rotate(-180deg)',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: tokens.spacingHorizontalL,
    padding: 0,
  },
  itemContent: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  itemActionContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  fullWidthControl: {
    width: '100%',
  },
});

export const CardItem: React.FC<CardItemProps> = ({
  header,
  description,
  control,
  disabled = false,
  fullWidthControl = false,
  onClick,
}) => {
  const styles = useStyles();

  return (
    <div
      className={styles.itemRow}
      onClick={onClick}
      style={{
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        paddingLeft: fullWidthControl ? undefined : "36px",
      }}
    >
      <div className={styles.itemContent}>
        {header && <Text size={300}>{header}</Text>}
        {description && (
          <Text size={200} style={{ color: tokens.colorNeutralForeground2, whiteSpace: "nowrap" }}>
            {description}
          </Text>
        )}
      </div>
      {control && (
        <div className={mergeClasses(styles.itemActionContainer, fullWidthControl && styles.fullWidthControl)}>
          {control}
        </div>
      )}
    </div>
  );
};

export const Card: React.FC<CardProps> = ({
  icon,
  iconImage,
  header,
  description,
  control,
  expandable = false,
  initiallyExpanded = false,
  children,
  onExpandedChange,
  disabled = false,
}) => {
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded && expandable);

  const handleToggleExpand = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent card click if header itself is clickable
    if (expandable) {
      const newExpandedState = !isExpanded;
      setIsExpanded(newExpandedState);
      if (onExpandedChange) {
        onExpandedChange(newExpandedState);
      }
    }
  };

  const hoverBackground = expandable ? "rgb(from var(--colorNeutralForeground1) r g b / 0.05)" : undefined;

  // Custom rendering for the CardHeader's 'header' prop to include the icon correctly
  const renderedCardHeaderContent = (
    <div className={styles.headerRow}>
      {icon && <Icon icon={icon} className={styles.icon} />}
      {iconImage && <img src={iconImage} alt="Icon" className={styles.icon} />}
      <div className={styles.headerTextContent}>
        <Text size={300}>{header}</Text>
        {description && (
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            {description}
          </Text>
        )}
      </div>
    </div>
  );

  const renderedCardHeaderAction = (
    <div className={styles.headerActionContainer}>
      {control && (
        <div onClick={(e) => e.stopPropagation()}>
          {control}
        </div>
      )}
      {expandable && (
        <Button
          appearance="transparent"
          icon={
            <ChevronUpRegular
              className={mergeClasses(
                styles.chevronIcon,
                !isExpanded && styles.rotated
              )}
            />
          }
          onClick={handleToggleExpand}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Collapse ${header}` : `Expand ${header}`}
        />
      )}
    </div>
  );

  return (
    <FluentCard className={styles.card} style={{ '--hoverBackground': hoverBackground, opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' } as React.CSSProperties}>
      <CardHeader
        className={styles.cardHeader}
        header={renderedCardHeaderContent}
        action={renderedCardHeaderAction}
        onClick={expandable ? handleToggleExpand : undefined}
      />
      {expandable && children && (
        <div
          className={mergeClasses(
            isExpanded ? styles.expandedContent : styles.collapsedContent
          )}
          style={{
            maxHeight: isExpanded ? '1000px' : '0',
            transition: 'max-height 0.2s ease'
          }}
        >
          {React.Children.map(children, (child, index) => {
            if (!React.isValidElement(child)) return child;

            // Extract the onClick handler from the child
            const childOnClick = child.props.onClick;

            // Create wrapper onClick that calls child's onClick
            const wrapperOnClick = childOnClick ? (e: React.MouseEvent) => {
              e.stopPropagation(); // Prevent bubbling
              childOnClick(e);
            } : undefined;

            return (
              <div
                className={styles.contentWrapper}
                key={index}
                onClick={wrapperOnClick}
                style={{
                  opacity: isExpanded ? 1 : 0,
                  transform: isExpanded ? 'translateY(0)' : 'translateY(-20px)',
                }}
              >
                {/* Clone the child element but remove its onClick to prevent double firing */}
                {React.isValidElement(child)
                  ? React.cloneElement(child, { ...child.props, onClick: undefined })
                  : child}
              </div>
            );
          })}
        </div>
      )}
    </FluentCard>
  );
};