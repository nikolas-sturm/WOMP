use womp::ccd::CCDWrapper;
use womp::global_state::{init_debug_flag, is_debug};
use womp::serde::config::Config;
use womp::{apply_profile_from_file, get_config_path, save_current_profile};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_profiles])
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
