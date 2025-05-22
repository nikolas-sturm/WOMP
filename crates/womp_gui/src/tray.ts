import { invoke } from '@tauri-apps/api/core';
import { IconMenuItem, Menu, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu';
import { TrayIcon } from '@tauri-apps/api/tray';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { exit } from '@tauri-apps/plugin-process';
import { glyphToImage } from './lib/glyphToImage';
import { Profile } from './lib/types';

type ProfileAction = "apply" | "save" | "delete";

async function createProfileMenuItems(profiles: Profile[], action: ProfileAction) {
  const actionHandlers = {
    apply: (profile: Profile) => () => invoke("apply_display_layout", { profileName: profile.name }),

    save: (profile: Profile) => async () => {
      showDialog(`save-profile-${profile.name}`);
    },

    delete: (profile: Profile) => async () => {
      showDialog(`delete-profile-${profile.name}`);
    }
  };

  return Promise.all(profiles.map(async (profile) => {
    const profileIcon = await glyphToImage(profile.config?.icon);
    return IconMenuItem.new({
      id: `${action}-${profile.name}`,
      text: profile.config?.name ?? profile.name,
      icon: profileIcon,
      action: actionHandlers[action](profile)
    });
  }));
}

async function showWindow(label: string) {
  const window = await WebviewWindow.getByLabel(label);
  if (!window) return;

  window.show();
  window.setFocus();

  if (await window.isMinimized()) {
    window.unminimize();
  }
}

async function showDialog(dialogType: string) {
  const dialog = await WebviewWindow.getByLabel("dialog");
  if (!dialog) return;

  dialog.emit("dialogType", dialogType);
  dialog.show();
  dialog.setFocus();
}

async function createMenu(profiles: Profile[]): Promise<Menu> {
  const separator = await PredefinedMenuItem.new({
    text: 'separator-text',
    item: 'Separator',
  });

  const configMenuItem = await IconMenuItem.new({
    id: 'open-config',
    text: 'Open Config',
    icon: await glyphToImage("\uE713"),
    action: () => showWindow("main")
  });

  const quitMenuItem = await IconMenuItem.new({
    id: 'quit',
    text: 'Quit',
    icon: await glyphToImage("\uE711"),
    action: () => exit()
  });

  if (profiles.length === 0) {
    return Menu.new({
      items: [configMenuItem, separator, quitMenuItem]
    });
  }

  const profileMenuItems = await createProfileMenuItems(profiles, "apply");
  const saveProfileItems = await createProfileMenuItems(profiles, "save");
  const deleteProfileItems = await createProfileMenuItems(profiles, "delete");

  const saveCurrentProfileMenuItem = await IconMenuItem.new({
    id: 'new-profile',
    text: 'New Profile...',
    icon: await glyphToImage("\uE74E"),
    action: () => showDialog("new-profile")
  });

  const deleteProfileSubmenu = await Submenu.new({
    id: 'delete-profile',
    text: 'Delete Profile',
    items: deleteProfileItems
  });

  const saveProfileSubmenu = await Submenu.new({
    id: 'save-current-profile',
    text: 'Save Current Profile',
    items: [saveCurrentProfileMenuItem, separator, ...saveProfileItems]
  });

  return Menu.new({
    items: [
      ...profileMenuItems,
      separator,
      saveProfileSubmenu,
      deleteProfileSubmenu,
      separator,
      configMenuItem,
      separator,
      quitMenuItem,
    ]
  });
}

export async function createTray(profiles: Profile[]) {
  try {
    const tray = await TrayIcon.getById("womp-tray");
    if (tray) return;

    await TrayIcon.new({
      id: "womp-tray",
      icon: await glyphToImage("\uE7F4"),
      menu: await createMenu(profiles),
      tooltip: 'WOMP Configuration',
      menuOnLeftClick: true
    });
  } catch (error) {
    console.error('Failed to create tray icon:', error);
    throw error;
  }
}

export async function updateTray(profiles: Profile[]) {
  try {
    const tray = await TrayIcon.getById("womp-tray");
    if (!tray) {
      console.error('Tray not found');
      return;
    }

    await tray.setMenu(await createMenu(profiles));
  } catch (error) {
    console.error('Failed to update tray menu:', error);
    throw error;
  }
}
