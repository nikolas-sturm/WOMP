use std::sync::Arc;
use std::sync::Once;
use tauri::Emitter;
use tauri::{AppHandle, Manager, WebviewWindowBuilder};
use window_vibrancy::*;
use windows::Foundation::TypedEventHandler;
use windows::UI::ViewManagement::{UIColorType, UISettings};

pub mod external;
pub mod tray;

// Store everything related to color change detection
struct ColorChangeHandler {
    _settings: UISettings, // Keep UISettings alive
    _registration: i64,    // Keep event registration token alive
}

// Static holder for our handler
static INIT: Once = Once::new();
static mut COLOR_HANDLER: Option<Arc<ColorChangeHandler>> = None;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    unsafe {
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--enable-features=msEdgeFluentOverlayScrollbar,msOverlayScrollbarWinStyle",
        );
    }

    tauri::Builder::default()
        .setup(|app| {
            let _tray = tray::create_tray(app);

            let main_window = WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::External(tauri::Url::parse("http://localhost:1420").unwrap()),
            )
            .title("WOMP Config UI")
            .inner_size(800.0, 600.0)
            .min_inner_size(800.0, 600.0)
            .resizable(true)
            .decorations(false)
            .transparent(true)
            .visible(false)
            .build()
            .unwrap();

            apply_mica(&main_window, None).expect("Failed to apply mica");
            main_window.show().expect("Failed to show main window");

            // Set up color change listener
            setup_color_change_listener(app.app_handle().clone());

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            change_theme,
            get_system_colors,
            external::apply_display_layout,
            external::save_current_display_layout,
            external::get_profiles,
            external::get_config_dir,
            external::get_profiles_dir,
            external::get_profile_dir,
            external::read_display_config,
            external::write_display_config,
            external::rename_profile,
            external::delete_profile,
            external::clone_profile,
            external::open_profile_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
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
                // When colors change, emit an event to the frontend
                let colors = get_system_colors();
                handle_clone.emit("system-colors-changed", colors).ok();
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
fn change_theme(handle: AppHandle, dark: bool) {
    let window = handle.get_webview_window("main").unwrap();

    apply_mica(&window, Some(dark)).expect("Failed to apply mica");
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
