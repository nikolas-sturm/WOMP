use tauri::{Manager, AppHandle, Window};
use window_vibrancy::*;
use womp::{get_config_path};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            apply_mica(&window, Some(true)).expect("Failed to apply mica");
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_profiles, change_theme])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_profiles() -> Vec<String> {
    let config_dir = get_config_path().unwrap();
    let profile_dir = config_dir.join("profiles");
    let mut profiles = Vec::new();
    for entry in std::fs::read_dir(profile_dir).unwrap() {
        let entry = entry.unwrap();
        let path = entry.path();
        profiles.push(path.file_name().unwrap().to_str().unwrap().to_string());
    }
    profiles
}

#[tauri::command]
fn change_theme(handle: AppHandle, dark: bool) {
    let window = handle.get_webview_window("main").unwrap();
    
    apply_mica(&window, Some(dark)).expect("Failed to apply mica");
}