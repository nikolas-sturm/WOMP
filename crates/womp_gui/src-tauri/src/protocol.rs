use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use womp::serde::config::Config;
use womp::{get_config_path, read_config};

#[derive(Serialize, Deserialize)]
pub struct Profile {
    name: String,
    config: Option<Config>,
}

#[tauri::command]
pub fn get_profiles() -> Vec<Profile> {
    let config_dir = get_config_path().unwrap();
    let profile_dir = config_dir.join("profiles");
    let mut profiles = Vec::new();
    for entry in std::fs::read_dir(profile_dir).unwrap() {
        let entry = entry.unwrap();
        let path = entry.path();
        profiles.push(Profile {
            name: path.file_name().unwrap().to_str().unwrap().to_string(),
            config: match get_profile_config(&path) {
                Ok(c) => Some(c),
                Err(_) => None,
            },
        });
    }
    profiles
}

fn get_profile_config(profile_dir: &PathBuf) -> Result<Config, String> {
    let config_file = profile_dir.join("profile.toml");

    let config_exists = std::fs::exists(&config_file).unwrap();

    if !config_exists {
        return Err("Config file does not exist".to_string());
    }

    Ok(read_config(&config_file).expect("Couldn't read config file"))
}
