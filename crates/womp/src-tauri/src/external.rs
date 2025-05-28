use serde::{Deserialize, Serialize};
use tauri::command;
use womp_core::serde_types::{config::Config, global_config::GlobalConfig};

#[derive(Serialize, Deserialize)]
pub struct Profile {
    name: String,
    config: Option<Config>,
}

#[command]
pub fn get_profiles() -> Result<Vec<Profile>, String> {
    let profiles = womp_core::config_manager::get_profiles_and_configs().unwrap();
    let profiles = profiles
        .into_iter()
        .map(|(name, config)| Profile { name, config })
        .collect();
    Ok(profiles)
}

#[command]
pub fn get_active_profile() -> Result<Option<String>, String> {
    let global_config = get_global_config().unwrap();
    womp_core::get_active_profile(&global_config)
}

#[command]
pub fn next_profile() -> Result<(), String> {
    let profiles = get_profiles().unwrap();
    let active_profile = get_active_profile().unwrap();
    if let Some(active_profile) = active_profile {
        let active_profile_index = profiles
            .iter()
            .position(|p| p.name == active_profile)
            .unwrap();
        let next_profile_index = (active_profile_index + 1) % profiles.len();
        let next_profile = profiles[next_profile_index].name.clone();
        apply_display_layout(next_profile)
    } else {
        Ok(())
    }
}

#[command]
pub fn previous_profile() -> Result<(), String> {
    let profiles = get_profiles().unwrap();
    let active_profile = get_active_profile().unwrap();
    if let Some(active_profile) = active_profile {
        let active_profile_index = profiles
            .iter()
            .position(|p| p.name == active_profile)
            .unwrap();
        let previous_profile_index = (active_profile_index + profiles.len() - 1) % profiles.len();
        let previous_profile = profiles[previous_profile_index].name.clone();
        apply_display_layout(previous_profile)
    } else {
        Ok(())
    }
}

#[command]
pub fn get_global_config() -> Result<GlobalConfig, String> {
    Ok(womp_core::get_global_config())
}

#[command]
pub fn set_global_config(global_config: GlobalConfig) -> Result<(), String> {
    womp_core::set_global_config(&global_config)
}

#[command]
pub fn apply_display_layout(profile_name: String) -> Result<(), String> {
    let global_config = get_global_config().unwrap();
    womp_core::apply_display_layout(&profile_name, &global_config, false)
}

#[command]
pub fn save_current_display_layout(profile_name: String) -> Result<(), String> {
    let global_config = get_global_config().unwrap();
    womp_core::save_current_display_layout(&profile_name, &global_config, false)
}

#[command]
pub fn get_config_dir() -> Result<String, String> {
    let config_dir = womp_core::config_manager::get_config_dir().unwrap();
    Ok(config_dir.to_string_lossy().to_string())
}

#[command]
pub fn get_profiles_dir() -> Result<String, String> {
    let profiles_dir = womp_core::config_manager::get_profiles_dir().unwrap();
    Ok(profiles_dir.to_string_lossy().to_string())
}

#[command]
pub fn get_profile_dir(profile_name: String) -> Result<String, String> {
    let profile_dir = womp_core::config_manager::get_profile_dir(&profile_name).unwrap();
    Ok(profile_dir.to_string_lossy().to_string())
}

#[command]
pub fn read_display_config(profile_name: String) -> Result<Config, String> {
    womp_core::config_manager::read_display_config(&profile_name)
}

#[command]
pub fn write_display_config(config: Config, profile_name: String) -> Result<(), String> {
    womp_core::config_manager::write_display_config(&config, &profile_name)
}

#[command]
pub fn rename_profile(old_name: String, new_name: String) -> Result<(), String> {
    womp_core::config_manager::rename_profile_folder(&old_name, &new_name)
}

#[command]
pub fn delete_profile(profile_name: String) -> Result<(), String> {
    womp_core::config_manager::delete_profile_dir(&profile_name)
}

#[command]
pub fn clone_profile(profile_name: String) -> Result<String, String> {
    womp_core::config_manager::clone_profile_dir(&profile_name)
}

#[command]
pub fn open_profile_dir(profile_name: String) -> Result<(), String> {
    womp_core::config_manager::open_profile_dir(&profile_name)
}

#[command]
pub fn turn_off_all_displays() -> Result<(), String> {
    womp_core::turn_off_all_displays(false)
}
