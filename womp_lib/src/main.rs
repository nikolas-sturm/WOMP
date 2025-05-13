use ccd::CCDWrapper;
use dirs::config_dir;
use std::{fs, io::BufReader, path::PathBuf};

mod ccd;
mod serde;

fn get_config_path() -> Result<PathBuf, String> {
    let mut config_path = config_dir().ok_or("Could not determine config directory")?;
    config_path.push("WOMP");
    std::fs::create_dir_all(&config_path)
        .map_err(|e| format!("Failed to create config dir: {e}"))?;
    Ok(config_path)
}

fn get_profile_path(name: String) -> Result<PathBuf, String> {
    let config_path = get_config_path().expect("Couldn't get config dir!");
    let profile_dir = config_path.join("profiles");
    std::fs::create_dir_all(&profile_dir)
        .map_err(|e| format!("Failed to create profiles dir: {e}"))?;
    let profile_path = profile_dir.join(name + ".json");
    Ok(profile_path)
}

pub fn save_current_profile(wrapper: &mut CCDWrapper, profile_path: PathBuf) {
    let result = wrapper.get_displays();
    match result {
        Ok(ref displays) => {
            let serialized = serde_json::to_string_pretty(displays).unwrap();
            fs::write(profile_path, serialized).expect("Unable to write file");
        }
        Err(ref e) => {
            eprintln!("Failed to retrieve displays: {e}");
        }
    }
}

pub fn apply_profile_from_file(wrapper: &mut CCDWrapper, profile_path: PathBuf) {
    let profile_file = fs::File::open(&profile_path)
        .expect(format!("Couldn't open profile at {profile_path:?}").as_str());
    let profile_reader = BufReader::new(profile_file);
    let mut profile: Vec<serde::Display> = serde_json::from_reader(profile_reader)
        .expect(format!("Couldn't parse JSON from {profile_path:?}").as_str());
    let result = wrapper.apply_profile(&mut profile);
    match result {
        Ok(_) => (),
        Err(ref e) => {
            eprintln!("Failed to apply profile: {e}");
        }
    }
}

fn main() {
    let profile_path = match get_profile_path(String::from("Desktop")) {
        Ok(path) => path,
        Err(e) => {
            eprintln!("Config path error: {e}");
            return;
        }
    };

    let mut wrapper = CCDWrapper::new(true);

    //save_current_profile(&mut wrapper, profile_path);

    let _result = apply_profile_from_file(&mut wrapper, profile_path);
}
