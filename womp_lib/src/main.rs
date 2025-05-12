use ccd::CCDWrapper;
use dirs::config_dir;
use std::{fs, path::PathBuf};

mod ccd;
mod types;

fn get_config_file() -> Result<PathBuf, String> {
    let mut config_path = config_dir().ok_or("Could not determine config directory")?;
    config_path.push("WOMP");
    std::fs::create_dir_all(&config_path).map_err(|e| format!("Failed to create config dir: {e}"))?;
    config_path.push("config.json");
    Ok(config_path)
}

fn main() {
    let config_file = match get_config_file() {
        Ok(path) => path,
        Err(e) => {
            eprintln!("Config path error: {e}");
            return;
        }
    };

    let mut wrapper = CCDWrapper::new(true);

    let result = wrapper.get_displays();
    match result {
        Ok(ref displays) => {
            let serialized = serde_json::to_string_pretty(displays).unwrap();
            fs::write(config_file, serialized).expect("Unable to write file");
        }
        Err(ref e) => {
            eprintln!("Failed to retrieve displays: {e}");
        }
    }
}