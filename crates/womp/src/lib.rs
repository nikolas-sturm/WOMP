use ccd::CCDWrapper;
use dirs::config_dir;
use serde::config::{Config, Data};
use std::{fs, io::BufReader, path::PathBuf};

pub mod ccd;
pub mod serde;

pub fn get_config_path() -> Result<PathBuf, String> {
    let mut config_path = config_dir().ok_or("Could not determine config directory")?;
    config_path.push("WOMP");
    std::fs::create_dir_all(&config_path)
        .map_err(|e| format!("Failed to create config dir: {e}"))?;
    Ok(config_path)
}

pub fn get_profile_path(name: &String) -> Result<PathBuf, String> {
    let config_path = get_config_path().expect("Couldn't get config dir!");
    let profiles_dir = config_path.join("profiles");
    std::fs::create_dir_all(&profiles_dir)
        .map_err(|e| format!("Failed to create profiles parent dir: {e}"))?;
    let profile_dir = profiles_dir.join(String::from(name));
    std::fs::create_dir_all(&profile_dir)
        .map_err(|e| format!("Failed to create profile dir: {e}"))?;
    Ok(profile_dir)
}

pub fn read_config(config_file: &PathBuf) -> Result<Config, String> {
    let contents = match fs::read_to_string(config_file) {
        Ok(c) => c,
        Err(_) => {
            eprintln!(
                "Could not read config file `{}`.",
                config_file.to_string_lossy()
            );
            return Err(format!(
                "Config file `{}` does not exist.",
                config_file.to_string_lossy()
            ));
        }
    };

    let data: Data = match toml::from_str(&contents) {
        Ok(d) => d,
        Err(_) => {
            eprintln!(
                "Could not parse data in config file `{}`, will skip.",
                config_file.to_string_lossy()
            );
            return Err(format!(
                "Invalid config in `{}`.",
                config_file.to_string_lossy()
            ));
        }
    };

    Ok(data.config)
}

pub fn save_current_profile(
    wrapper: &mut CCDWrapper,
    profile_path: &PathBuf,
) -> Result<(), std::io::Error> {
    let result = wrapper.get_displays();
    match result {
        Ok(ref displays) => {
            let serialized = serde_json::to_string_pretty(displays).unwrap();
            fs::write(profile_path, serialized)
        }
        Err(ref e) => {
            return Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("Failed to retrieve displays: {e}"),
            ));
        }
    }
}

pub fn apply_profile_from_file(
    wrapper: &mut CCDWrapper,
    profile_path: &PathBuf,
) -> Result<(), String> {
    let profile_file = fs::File::open(&profile_path)
        .expect(format!("Couldn't open profile at {profile_path:?}").as_str());
    let profile_reader = BufReader::new(profile_file);
    let mut profile: Vec<serde::Display> = serde_json::from_reader(profile_reader)
        .expect(format!("Couldn't parse JSON from {profile_path:?}").as_str());
    wrapper.apply_profile(&mut profile)
}
