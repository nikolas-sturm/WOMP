use notify::RecursiveMode;
use notify_debouncer_full::{DebounceEventResult, new_debouncer};
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::Once;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tauri::Emitter;
use tauri::ipc::Channel;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_updater::UpdaterExt;
use time;
use window_vibrancy::*;
use windows::Foundation::TypedEventHandler;
use windows::UI::ViewManagement::{UIColorType, UISettings};

pub mod external;

// Store everything related to color change detection
struct ColorChangeHandler {
    _settings: UISettings, // Keep UISettings alive
    _registration: i64,    // Keep event registration token alive
}

// Thread-safe static for event emission control
static COLOR_EVENTS_ENABLED: AtomicBool = AtomicBool::new(true);

// Static holder for our handler
static INIT: Once = Once::new();
static mut COLOR_HANDLER: Option<Arc<ColorChangeHandler>> = None;

// Updater-related structures
#[derive(Debug, thiserror::Error)]
pub enum UpdaterError {
    #[error(transparent)]
    Updater(#[from] tauri_plugin_updater::Error),
    #[error("No update available")]
    NoUpdateAvailable,
}

impl Serialize for UpdaterError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_str())
    }
}

type UpdaterResult<T> = std::result::Result<T, UpdaterError>;

#[derive(Clone, Serialize)]
#[serde(tag = "event", content = "data")]
pub enum DownloadEvent {
    #[serde(rename_all = "camelCase")]
    Started {
        content_length: Option<u64>,
    },
    #[serde(rename_all = "camelCase")]
    Progress {
        chunk_length: usize,
    },
    Finished,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    version: String,
    current_version: String,
    date: Option<String>,
    body: Option<String>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    unsafe {
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--enable-features=msEdgeFluentOverlayScrollbar,msOverlayScrollbarWinStyle",
        );
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!(
                "Attempted to launch second instance with args: {:?} in {:?}",
                argv, cwd
            );

            // Focus the main window when a second instance is launched
            if let Some(main_window) = app.get_webview_window("main") {
                if let Err(e) = main_window.set_focus() {
                    eprintln!("Failed to focus main window: {}", e);
                }

                if let Err(e) = main_window.unminimize() {
                    eprintln!("Failed to unminimize main window: {}", e);
                }

                if let Err(e) = main_window.show() {
                    eprintln!("Failed to show main window: {}", e);
                }

                // Optionally notify the user
                app.emit_to("main", "second-instance", argv)
                    .unwrap_or_else(|e| {
                        eprintln!("Failed to emit second-instance event: {}", e);
                    });
            }
        }))
        .setup(|app| {
            let main_window = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::App(PathBuf::from("?view=main")),
            )
            .title("WOMP Config UI")
            .inner_size(1000.0, 700.0)
            .min_inner_size(600.0, 500.0)
            .resizable(true)
            .decorations(false)
            .transparent(true)
            .visible(false)
            .build()
            .unwrap();

            let dialog_window = WebviewWindowBuilder::new(
                app,
                "dialog",
                WebviewUrl::App(PathBuf::from("?view=dialog")),
            )
            .title("Dialog")
            .inner_size(320.0, 174.0)
            .min_inner_size(320.0, 174.0)
            .center()
            .resizable(false)
            .decorations(false)
            .transparent(true)
            .visible(false)
            .build()
            .unwrap();

            apply_mica(&main_window, None).expect("Failed to apply mica");
            apply_mica(&dialog_window, None).expect("Failed to apply mica");

            main_window.show().unwrap();

            // Set up color change listener
            setup_color_change_listener(app.app_handle().clone());

            // Set up profiles directory watcher
            setup_profiles_dir_watcher(app.app_handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            change_theme,
            get_system_colors,
            emit_to_window,
            set_color_events_enabled,
            check_for_update,
            download_and_install_update,
            restart_app,
            external::apply_display_layout,
            external::save_current_display_layout,
            external::get_profiles,
            external::get_active_profile,
            external::next_profile,
            external::previous_profile,
            external::get_config_dir,
            external::get_profiles_dir,
            external::get_profile_dir,
            external::read_display_config,
            external::write_display_config,
            external::rename_profile,
            external::delete_profile,
            external::clone_profile,
            external::open_profile_dir,
            external::turn_off_all_displays,
            external::get_global_config,
            external::set_global_config,
        ])
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_profiles_dir_watcher(app_handle: AppHandle) {
    // Create a thread-local watcher to avoid dropping it
    std::thread::spawn(move || {
        // Get the config directory and join with "WOMP/profiles"
        if let Ok(config_dir) = app_handle.path().config_dir() {
            let profiles_dir = config_dir.join("WOMP").join("profiles");

            // Create the debounced event handler
            let event_handler = move |res: DebounceEventResult| {
                match res {
                    Ok(events) => {
                        if !events.is_empty() {
                            // When any file system event occurs, emit a "profiles_updated" event
                            app_handle
                                .emit_to("main", "event", "profiles_updated")
                                .unwrap_or_else(|e| {
                                    eprintln!("Failed to emit profiles_updated event: {}", e);
                                });
                        }
                    }
                    Err(e) => eprintln!("Watch error: {:?}", e),
                }
            };

            // Create a new debounced watcher with the event handler
            match new_debouncer(Duration::from_millis(100), None, event_handler) {
                Ok(mut debouncer) => {
                    // Watch the profiles directory recursively
                    if let Err(e) =
                        debouncer.watch(Path::new(&profiles_dir), RecursiveMode::Recursive)
                    {
                        eprintln!("Failed to watch profiles directory: {}", e);
                    } else {
                        // Keep the watcher alive
                        std::thread::park();
                    }
                }
                Err(e) => eprintln!("Failed to create debounced watcher: {}", e),
            }
        } else {
            eprintln!("Failed to get app config directory");
        }
    });
}

fn setup_color_change_listener(app_handle: AppHandle) {
    // Ensure we only initialize the handler once
    INIT.call_once(|| {
        // Create UI settings
        let settings = UISettings::new().expect("Failed to create UISettings");

        // Clone the app_handle for use in the event handler
        let handle_clone = app_handle.clone();

        // Register the event handler
        let registration = settings
            .ColorValuesChanged(&TypedEventHandler::new(move |_, _| {
                // Only emit events if color events are enabled
                if COLOR_EVENTS_ENABLED.load(Ordering::Relaxed) {
                    // When colors change, emit an event to the frontend
                    let colors = get_system_colors();
                    handle_clone.emit("system-colors-changed", colors).ok();
                }
                Ok(())
            }))
            .expect("Failed to register color change handler");

        // Store both the settings and registration to keep them alive
        let handler = Arc::new(ColorChangeHandler {
            _settings: settings,
            _registration: registration,
        });

        unsafe {
            COLOR_HANDLER = Some(handler);
        }
    });
}

#[tauri::command]
fn set_color_events_enabled(enabled: bool) -> Result<(), String> {
    COLOR_EVENTS_ENABLED.store(enabled, Ordering::Relaxed);
    Ok(())
}

#[tauri::command]
fn change_theme(handle: AppHandle, theme: String) {
    let windows = handle.windows();

    let dark = match theme.as_str() {
        "dark" => Some(true),
        "light" => Some(false),
        _ => None,
    };

    let tauri_theme = match theme.as_str() {
        "dark" => Some(tauri::Theme::Dark),
        "light" => Some(tauri::Theme::Light),
        _ => None,
    };

    for (_, window) in windows {
        let _ = window.set_theme(tauri_theme);

        apply_mica(&window, dark).expect("Failed to apply mica");
    }
}

#[tauri::command]
fn get_system_colors() -> [String; 9] {
    let settings = UISettings::new().expect("Failed to create UISettings");

    let color_types = [
        UIColorType::Background,
        UIColorType::Foreground,
        UIColorType::AccentDark3,
        UIColorType::AccentDark2,
        UIColorType::AccentDark1,
        UIColorType::Accent,
        UIColorType::AccentLight1,
        UIColorType::AccentLight2,
        UIColorType::AccentLight3,
    ];

    let mut result = std::array::from_fn(|_| String::new());

    for (i, color_type) in color_types.iter().enumerate() {
        let color = settings
            .GetColorValue(*color_type)
            .expect("Failed to get color");
        result[i] = format!("rgb({}, {}, {})", color.R, color.G, color.B);
    }

    result
}

#[tauri::command]
fn emit_to_window(handle: AppHandle, window_name: &str, event: &str, payload: &str) {
    let window = handle.get_webview_window(window_name).unwrap();
    window.emit(event, payload).unwrap();
}

// Updater Commands

#[tauri::command]
async fn check_for_update(app: AppHandle) -> UpdaterResult<Option<UpdateInfo>> {
    match app.updater()?.check().await {
        Ok(Some(update)) => {
            let update_info = UpdateInfo {
                version: update.version.clone(),
                current_version: update.current_version.clone(),
                date: update.date.map(|dt| {
                    dt.format(&time::format_description::well_known::Rfc3339)
                        .unwrap()
                }),
                body: update.body.clone(),
            };

            Ok(Some(update_info))
        }
        Ok(None) => Ok(None),
        Err(e) => Err(UpdaterError::from(e)),
    }
}

#[tauri::command]
async fn download_and_install_update(
    app: AppHandle,
    on_event: Channel<DownloadEvent>,
) -> UpdaterResult<()> {
    // Check for update first
    let update = match app.updater()?.check().await? {
        Some(update) => update,
        None => return Err(UpdaterError::NoUpdateAvailable),
    };

    let mut started = false;

    // Download and install with progress tracking
    update
        .download_and_install(
            |chunk_length, content_length| {
                if !started {
                    let _ = on_event.send(DownloadEvent::Started { content_length });
                    started = true;
                }
                let _ = on_event.send(DownloadEvent::Progress { chunk_length });
            },
            || {
                let _ = on_event.send(DownloadEvent::Finished);
            },
        )
        .await?;

    Ok(())
}

#[tauri::command]
#[allow(unreachable_code)]
async fn restart_app(app: AppHandle) -> Result<(), String> {
    app.restart();
    Ok(()) // This will never be reached, but satisfies the type system
}
