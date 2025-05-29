import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
  ProgressBar,
  Spinner,
  Text,
  tokens
} from '@fluentui/react-components';
import { useEffect, useState } from 'react';
import { DownloadEvent, formatDownloadProgress, UpdateInfo, UpdaterService } from '../lib/updater';

const useStyles = makeStyles({
  dialogSurface: {
    width: 'fit-content',
    maxWidth: '500px',
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minHeight: '200px',
  },
  centerContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
  },
  errorMessage: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorPaletteRedBackground2,
    border: `1px solid ${tokens.colorPaletteRedBorder2}`,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorPaletteRedForeground2,
  },
  updateDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  updateField: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  fieldLabel: {
    fontWeight: tokens.fontWeightSemibold,
    minWidth: '80px',
  },
  releaseNotes: {
    maxHeight: '120px',
    overflowY: 'auto',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  buttonGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    justifyContent: 'flex-end',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    alignItems: 'center',
  },
  progressText: {
    textAlign: 'center',
  },
  noUpdateText: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground2,
  },
  downloadInfo: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
  },
});

interface UpdaterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  autoCheck?: boolean;
}

export function UpdaterDialog({ isOpen, onClose, autoCheck = false }: UpdaterDialogProps) {
  const styles = useStyles();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isOpen && autoCheck) {
      checkForUpdates();
    }
  }, [isOpen, autoCheck]);

  const checkForUpdates = async () => {
    setIsChecking(true);
    setError(null);
    setUpdateInfo(null);

    try {
      const update = await UpdaterService.checkForUpdate();
      setUpdateInfo(update);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check for updates');
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownloadAndInstall = async () => {
    if (!updateInfo) return;

    setIsDownloading(true);
    setError(null);
    setDownloadedBytes(0);
    setTotalBytes(undefined);

    try {
      await UpdaterService.downloadAndInstall((event: DownloadEvent) => {
        switch (event.event) {
          case 'Started':
            setTotalBytes(event.data?.contentLength);
            setDownloadProgress('Starting download...');
            break;
          case 'Progress':
            if (event.data?.chunkLength) {
              setDownloadedBytes(prev => {
                const newTotal = prev + event.data!.chunkLength!;
                setDownloadProgress(formatDownloadProgress(newTotal, totalBytes));
                return newTotal;
              });
            }
            break;
          case 'Finished':
            setDownloadProgress('Download complete! Installing...');
            break;
        }
      });

      // After successful installation, restart the app
      await UpdaterService.restartApp();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download/install update');
      setIsDownloading(false);
    }
  };

  const resetState = () => {
    setUpdateInfo(null);
    setError(null);
    setDownloadProgress('');
    setDownloadedBytes(0);
    setTotalBytes(undefined);
    setIsDownloading(false);
    setIsChecking(false);
  };

  const handleClose = () => {
    if (!isDownloading) {
      resetState();
      onClose();
    }
  };

  const renderDialogContent = () => {
    if (error) {
      return (
        <>
          <div className={styles.errorMessage}>
            <Text>{error}</Text>
          </div>
          <DialogActions>
            <Button appearance="primary" onClick={checkForUpdates}>
              Try Again
            </Button>
            <Button appearance="secondary" onClick={handleClose}>
              Close
            </Button>
          </DialogActions>
        </>
      );
    }

    if (isChecking) {
      return (
        <div className={styles.centerContent}>
          <Spinner size="medium" />
          <Text>Checking for updates...</Text>
        </div>
      );
    }

    if (isDownloading) {
      return (
        <div className={styles.centerContent}>
          <Spinner size="medium" />
          <div className={styles.progressContainer}>
            <Text weight="medium">Updating WOMP...</Text>
            {downloadProgress && (
              <Text className={styles.progressText}>{downloadProgress}</Text>
            )}
            {totalBytes && (
              <ProgressBar
                value={Math.round((downloadedBytes / totalBytes) * 100)}
                max={100}
                thickness="medium"
              />
            )}
            <Text className={styles.downloadInfo}>
              The app will restart automatically after installation
            </Text>
          </div>
        </div>
      );
    }

    if (updateInfo) {
      return (
        <>
          <div className={styles.updateDetails}>
            <Text size={400} weight="semibold">Update Available!</Text>
            
            <div className={styles.updateField}>
              <Text className={styles.fieldLabel}>Current:</Text>
              <Text>{updateInfo.currentVersion}</Text>
            </div>
            
            <div className={styles.updateField}>
              <Text className={styles.fieldLabel}>New:</Text>
              <Text>{updateInfo.version}</Text>
            </div>
            
            {updateInfo.date && (
              <div className={styles.updateField}>
                <Text className={styles.fieldLabel}>Released:</Text>
                <Text>{new Date(updateInfo.date).toLocaleDateString()}</Text>
              </div>
            )}
            
            {updateInfo.body && (
              <>
                <Text className={styles.fieldLabel}>Release Notes:</Text>
                <div className={styles.releaseNotes}>
                  <Text size={200}>{updateInfo.body}</Text>
                </div>
              </>
            )}
          </div>
          
          <DialogActions>
            <Button appearance="primary" onClick={handleDownloadAndInstall}>
              Download & Install
            </Button>
            <Button appearance="secondary" onClick={handleClose}>
              Later
            </Button>
          </DialogActions>
        </>
      );
    }

    // No update available or initial state
    if (!isChecking && !updateInfo && !error) {
      return (
        <>
          <div className={styles.centerContent}>
            <Text className={styles.noUpdateText}>
              {updateInfo === null && !isChecking ? 
                'You\'re running the latest version' : 
                'Check if a new version is available'
              }
            </Text>
          </div>
          <DialogActions>
            <Button appearance="primary" onClick={checkForUpdates}>
              Check for Updates
            </Button>
            <Button appearance="secondary" onClick={handleClose}>
              Close
            </Button>
          </DialogActions>
        </>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle>App Updates</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            {renderDialogContent()}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

// Hook for easy integration
export function useUpdateChecker() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const checkForUpdates = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  return {
    isDialogOpen,
    checkForUpdates,
    closeDialog,
    UpdaterDialog: (props: Omit<UpdaterDialogProps, 'isOpen' | 'onClose'>) => (
      <UpdaterDialog
        {...props}
        isOpen={isDialogOpen}
        onClose={closeDialog}
      />
    ),
  };
} 