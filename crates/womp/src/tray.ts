import { glyphToImage } from '@/lib/glyphToImage';
import { notify } from '@/lib/notification';
import { Profile } from '@/lib/types';
import { invoke } from '@tauri-apps/api/core';
import { Image } from '@tauri-apps/api/image';
import { IconMenuItem, Menu, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu';
import { resolveResource } from '@tauri-apps/api/path';
import { TrayIcon } from '@tauri-apps/api/tray';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { exit } from '@tauri-apps/plugin-process';

type ProfileAction = "apply" | "save" | "delete";

async function createProfileMenuItems(profiles: Profile[], activeProfile: string | null, action: ProfileAction) {
    const actionHandlers = {
        apply: (profile: Profile) => () => {
            invoke("apply_display_layout", { profileName: profile.name });
            setTimeout(() => {
                notify("WOMP", `Profile "${profile.config?.name ?? profile.name}" applied`);
                invoke("emit_to_window", {
                    windowName: "main",
                    event: "event",
                    payload: "profiles_updated",
                });
            }, 2500); // Usually still laggy after apply, so wait a bit
        },

        save: (profile: Profile) => async () => {
            showDialog(`save-profile-${profile.name}`);
        },

        delete: (profile: Profile) => async () => {
            showDialog(`delete-profile-${profile.name}`);
        }
    };

    return Promise.all(profiles.map(async (profile) => {
        const profileIcon = await glyphToImage(profile.config?.icon);
        const isActive = activeProfile === profile.name;
        const profileText = isActive ? `${profile.config?.name ?? profile.name} (Active)` : profile.config?.name ?? profile.name;
        return IconMenuItem.new({
            id: `${action}-${profile.name}`,
            text: profileText,
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

async function createMenu(profiles: Profile[], activeProfile: string | null): Promise<Menu> {
    const separator = await PredefinedMenuItem.new({
        text: 'separator-text',
        item: 'Separator',
    });

    const turnOffAllDisplaysMenuItem = await IconMenuItem.new({
        id: 'turn-off-all-displays',
        text: 'Turn Off All Displays',
        icon: await glyphToImage("\uEA14"),
        action: () => invoke("turn_off_all_displays")
    });

    const refreshMenuItem = await IconMenuItem.new({
        id: 'refresh',
        text: 'Refresh Active',
        icon: await glyphToImage("\uE72C"),
        action: () => {
            invoke("emit_to_window", {
                windowName: "main",
                event: "event",
                payload: "profiles_updated",
            });
        }
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
        action: async () => {
            const result = await exit();
            console.log("exit result", result);
        }
    });

    if (profiles.length === 0) {
        return Menu.new({
            items: [configMenuItem, separator, quitMenuItem]
        });
    }

    const profileMenuItems = await createProfileMenuItems(profiles, activeProfile, "apply");
    const saveProfileItems = await createProfileMenuItems(profiles, activeProfile, "save");
    const deleteProfileItems = await createProfileMenuItems(profiles, activeProfile, "delete");

    const saveCurrentProfileMenuItem = await IconMenuItem.new({
        id: 'new-profile',
        text: 'New Profile...',
        icon: await glyphToImage("\uE836"),
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

    if (profiles.length === 1) {
        return Menu.new({
            items: [
                ...profileMenuItems,
                separator,
                saveProfileSubmenu,
                deleteProfileSubmenu,
                separator,
                turnOffAllDisplaysMenuItem,
                separator,
                refreshMenuItem,
                configMenuItem,
                separator,
                quitMenuItem,
            ]
        });
    }

    const nextProfileMenuItem = await IconMenuItem.new({
        id: 'next-profile',
        text: 'Next Profile',
        icon: await glyphToImage("\uE893"),
        action: () => {
            invoke("next_profile");
            setTimeout(() => {
                notify("WOMP", `Profile "${activeProfile}" applied`);
                invoke("emit_to_window", {
                    windowName: "main",
                    event: "event",
                    payload: "profiles_updated",
                });
            }, 2500);
        }
    });

    const previousProfileMenuItem = await IconMenuItem.new({
        id: 'previous-profile',
        text: 'Previous Profile',
        icon: await glyphToImage("\uE892"),
        action: () => {
            invoke("previous_profile");
            setTimeout(() => {
                notify("WOMP", `Profile "${activeProfile}" applied`);
                invoke("emit_to_window", {
                    windowName: "main",
                    event: "event",
                    payload: "profiles_updated",
                });
            }, 2500);
        }
    });

    return Menu.new({
        items: [
            ...profileMenuItems,
            separator,
            nextProfileMenuItem,
            previousProfileMenuItem,
            separator,
            saveProfileSubmenu,
            deleteProfileSubmenu,
            separator,
            turnOffAllDisplaysMenuItem,
            separator,
            refreshMenuItem,
            configMenuItem,
            separator,
            quitMenuItem,
        ]
    });
}

export async function createTray(profiles: Profile[], activeProfile: string | null, trayIcon: string) {
    try {
        const tray = await TrayIcon.getById("womp-tray");
        if (tray) return;

        const iconPath = await resolveResource("icons/32x32.png");

        const icon =
            trayIcon === "womp" ? await Image.fromPath(iconPath)
                : trayIcon === "display" ? await glyphToImage("\uE7F4")
                    : await glyphToImage("\uEBC6");

        console.log("icon", icon);

        await TrayIcon.new({
            id: "womp-tray",
            icon,
            menu: await createMenu(profiles, activeProfile),
            tooltip: 'WOMP Configuration',
            menuOnLeftClick: true
        });
    } catch (error) {
        console.error('Failed to create tray icon:', error);
        throw error;
    }
}

export async function updateTray(profiles: Profile[], activeProfile: string | null, trayIcon: string) {
    try {
        const tray = await TrayIcon.getById("womp-tray");
        if (!tray) {
            console.error('Tray not found');
            return;
        }

        const iconPath = await resolveResource("icons/32x32.png");

        console.log("iconPath", iconPath);

        const icon =
            trayIcon === "womp" ? await Image.fromPath(iconPath)
                : trayIcon === "display" ? await glyphToImage("\uE7F4")
                    : await glyphToImage("\uEBC6");

        console.log("icon", icon);

        await tray.setIcon(icon);

        await tray.setMenu(await createMenu(profiles, activeProfile));
    } catch (error) {
        console.error('Failed to update tray menu:', error);
        throw error;
    }
}
