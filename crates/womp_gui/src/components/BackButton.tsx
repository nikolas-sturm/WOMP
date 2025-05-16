import { Button, makeStyles } from "@fluentui/react-components";
const useStyles = makeStyles({
  button: {
    position: "fixed",
    top: "8px",
    left: "5px",
    zIndex: 1000,
    height: "34px",
  },
  buttonIcon: {
    position: "relative",
    top: "3px",
  },
});

export function BackButton() {
  const classes = useStyles();

  return <Button 
      className={classes.button} 
      appearance="subtle"
    ><span className={classes.buttonIcon}>&#xE830;</span></Button>;
}