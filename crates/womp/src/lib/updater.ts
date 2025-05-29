import { Channel, invoke } from '@tauri-apps/api/core';

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  date?: string;
  body?: string;
}

export interface DownloadEvent {
  event: 'Started' | 'Progress' | 'Finished';
  data?: {
    contentLength?: number;
    chunkLength?: number;
  };
}

export class UpdaterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdaterError';
  }
}

export class UpdaterService {
  /**
   * Check if an update is available
   * @returns UpdateInfo if update is available, null if no update
   */
  static async checkForUpdate(): Promise<UpdateInfo | null> {
    try {
      const result = await invoke<UpdateInfo | null>('check_for_update');
      return result;
    } catch (error) {
      throw new UpdaterError(`Failed to check for update: ${error}`);
    }
  }

  /**
   * Download and install an available update with progress tracking
   * @param onProgress Callback for progress events
   */
  static async downloadAndInstall(
    onProgress?: (event: DownloadEvent) => void
  ): Promise<void> {
    try {
      const channel = new Channel<DownloadEvent>();
      
      if (onProgress) {
        channel.onmessage = onProgress;
      }

      await invoke('download_and_install_update', {
        onEvent: channel,
      });
    } catch (error) {
      throw new UpdaterError(`Failed to download/install update: ${error}`);
    }
  }

  /**
   * Restart the application after update installation
   */
  static async restartApp(): Promise<void> {
    try {
      await invoke('restart_app');
    } catch (error) {
      throw new UpdaterError(`Failed to restart app: ${error}`);
    }
  }

  /**
   * Check for update, download, install, and restart in one operation
   * @param onProgress Callback for download progress
   * @param onUpdateFound Callback when update is found (optional confirmation)
   * @returns true if update was performed, false if no update available
   */
  static async checkAndUpdate(
    onProgress?: (event: DownloadEvent) => void,
    onUpdateFound?: (updateInfo: UpdateInfo) => Promise<boolean>
  ): Promise<boolean> {
    const updateInfo = await this.checkForUpdate();
    
    if (!updateInfo) {
      return false;
    }

    // If callback provided, ask for confirmation
    if (onUpdateFound) {
      const shouldUpdate = await onUpdateFound(updateInfo);
      if (!shouldUpdate) {
        return false;
      }
    }

    await this.downloadAndInstall(onProgress);
    await this.restartApp();
    return true;
  }
}

/**
 * Helper function to format download progress
 */
export function formatDownloadProgress(
  downloaded: number,
  total: number | undefined
): string {
  if (!total) {
    return `Downloaded ${(downloaded / 1024 / 1024).toFixed(1)} MB`;
  }

  const percent = Math.round((downloaded / total) * 100);
  const downloadedMB = (downloaded / 1024 / 1024).toFixed(1);
  const totalMB = (total / 1024 / 1024).toFixed(1);
  
  return `${downloadedMB} MB / ${totalMB} MB (${percent}%)`;
}

/**
 * Hook-style utility for React components
 */
export function useUpdater() {
  const checkForUpdate = UpdaterService.checkForUpdate;
  const downloadAndInstall = UpdaterService.downloadAndInstall;
  const restartApp = UpdaterService.restartApp;
  const checkAndUpdate = UpdaterService.checkAndUpdate;

  return {
    checkForUpdate,
    downloadAndInstall,
    restartApp,
    checkAndUpdate,
    formatProgress: formatDownloadProgress,
  };
} 