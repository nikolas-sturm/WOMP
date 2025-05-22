use serde::{Deserialize, Serialize};
use tauri::command;
use womp::serde_types::config::Config;

#[derive(Serialize, Deserialize)]
pub struct Profile {
    name: String,
    config: Option<Config>,
}

#[command]
pub fn get_profiles() -> Result<Vec<Profile>, String> {
    let profiles = womp::config_manager::get_profiles_and_configs().unwrap();
    let profiles = profiles
        .into_iter()
        .map(|(name, config)| Profile { name, config })
        .collect();
    Ok(profiles)
}

#[command]
pub fn apply_display_layout(profile_name: String) -> Result<(), String> {
    womp::apply_display_layout(&profile_name, true, false)
}

#[command]
pub fn save_current_display_layout(profile_name: String) -> Result<(), String> {
    womp::save_current_display_layout(&profile_name, false)
}

#[command]
pub fn get_config_dir() -> Result<String, String> {
    let config_dir = womp::config_manager::get_config_dir().unwrap();
    Ok(config_dir.to_string_lossy().to_string())
}

#[command]
pub fn get_profiles_dir() -> Result<String, String> {
    let profiles_dir = womp::config_manager::get_profiles_dir().unwrap();
    Ok(profiles_dir.to_string_lossy().to_string())
}

#[command]
pub fn get_profile_dir(profile_name: String) -> Result<String, String> {
    let profile_dir = womp::config_manager::get_profile_dir(&profile_name).unwrap();
    Ok(profile_dir.to_string_lossy().to_string())
}

#[command]
pub fn read_display_config(profile_name: String) -> Result<Config, String> {
    womp::config_manager::read_display_config(&profile_name)
}

#[command]
pub fn write_display_config(config: Config, profile_name: String) -> Result<(), String> {
    womp::config_manager::write_display_config(&config, &profile_name)
}

#[command]
pub fn rename_profile(old_name: String, new_name: String) -> Result<(), String> {
    womp::config_manager::rename_profile_folder(&old_name, &new_name)
}

#[command]
pub fn delete_profile(profile_name: String) -> Result<(), String> {
    womp::config_manager::delete_profile_dir(&profile_name)
}

#[command]
pub fn clone_profile(profile_name: String) -> Result<String, String> {
    womp::config_manager::clone_profile_dir(&profile_name)
}

#[command]
pub fn open_profile_dir(profile_name: String) -> Result<(), String> {
    womp::config_manager::open_profile_dir(&profile_name)
}
