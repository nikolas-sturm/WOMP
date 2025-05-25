use crate::serde_types::config::Config;
use dirs::config_dir;
use std::{fs, os::windows::process::CommandExt, path::PathBuf};

pub fn get_config_dir() -> Result<PathBuf, String> {
    let config_path = config_dir().expect("Couldn't get config dir!").join("WOMP");
    std::fs::create_dir_all(&config_path)
        .map_err(|e| format!("Failed to create config dir: {e}"))?;
    Ok(config_path)
}

pub fn get_profiles_dir() -> Result<PathBuf, String> {
    let profiles_dir = get_config_dir()
        .expect("Couldn't get config dir!")
        .join("profiles");
    std::fs::create_dir_all(&profiles_dir)
        .map_err(|e| format!("Failed to create profiles dir: {e}"))?;
    Ok(profiles_dir)
}

pub fn get_profiles_and_configs() -> Result<Vec<(String, Option<Config>)>, String> {
    let profiles_dir = get_profiles_dir().unwrap();
    let mut profiles = Vec::new();
    for entry in std::fs::read_dir(profiles_dir).unwrap() {
        let entry = entry.unwrap();
        let path = entry.path();
        let profile_name = path.file_name().unwrap().to_str().unwrap().to_string();
        let config = match read_display_config(&profile_name) {
            Ok(c) => Some(c),
            Err(_) => None,
        };
        profiles.push((profile_name.clone(), config));
    }
    Ok(profiles)
}

pub fn get_profile_dir(name: &String) -> Result<PathBuf, String> {
    let profile_dir = get_profiles_dir()
        .expect("Couldn't get profiles dir!")
        .join(String::from(name));
    Ok(profile_dir)
}

pub fn get_config_file_path(name: &String) -> Result<PathBuf, String> {
    let config_file = get_profile_dir(name)
        .expect("Couldn't get profile dir!")
        .join("profile.toml");
    Ok(config_file)
}

pub fn get_display_layout_file_path(name: &String) -> Result<PathBuf, String> {
    let display_layout_file = get_profile_dir(name)
        .expect("Couldn't get profile dir!")
        .join("displays.json");
    Ok(display_layout_file)
}

pub fn read_display_config(profile_name: &String) -> Result<Config, String> {
    let config_file = get_config_file_path(profile_name).expect("Couldn't get config file!");
    // Check if the file exists
    if !std::fs::metadata(&config_file).is_ok() {
        return Err(format!(
            "Config file `{}` does not exist.",
            config_file.to_string_lossy()
        ));
    }
    let contents = match fs::read_to_string(&config_file) {
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

    let config: Config = match toml::from_str(&contents) {
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

    Ok(config)
}

pub fn write_display_config(config: &Config, profile_name: &String) -> Result<(), String> {
    let config_str = toml::to_string(&config).unwrap();
    let config_file = get_config_file_path(profile_name).expect("Couldn't get config file!");
    std::fs::create_dir_all(config_file.parent().unwrap())
        .map_err(|e| format!("Failed to create profile dir: {e}"))?;
    fs::write(config_file, config_str).map_err(|e| format!("Failed to write config file: {e}"))
}

pub fn rename_profile_folder(old_name: &String, new_name: &String) -> Result<(), String> {
    let old_path = get_profile_dir(old_name).expect("Couldn't get old profile path!");
    let new_path = old_path.parent().unwrap().join(new_name);
    if std::fs::exists(&new_path).unwrap() {
        return Err("New profile path already exists".to_string());
    }
    fs::rename(old_path, new_path).map_err(|e| format!("Failed to rename profile: {e}"))
}

pub fn delete_profile_dir(profile_name: &String) -> Result<(), String> {
    let profile_path = get_profile_dir(profile_name).expect("Couldn't get profile path!");
    fs::remove_dir_all(profile_path).map_err(|e| format!("Failed to delete profile: {e}"))
}

fn get_clone_dir(source_dir: &PathBuf) -> PathBuf {
    let mut suffix = 1;
    let mut clone_dir;
    loop {
        let suffix_str = if suffix == 1 {
            "".to_string()
        } else {
            format!("_{}", suffix)
        };
        clone_dir = source_dir.parent().unwrap().join(format!(
            "{}_clone{}",
            source_dir.file_name().unwrap().to_string_lossy(),
            suffix_str
        ));
        if !std::fs::metadata(&clone_dir).is_err() {
            suffix += 1;
            continue;
        }
        break;
    }
    clone_dir
}

pub fn clone_profile_dir(profile_name: &String) -> Result<String, String> {
    let profile_dir = get_profile_dir(profile_name).expect("Couldn't get profile path!");
    let clone_dir = get_clone_dir(&profile_dir);

    let status = std::process::Command::new("cmd")
        .raw_arg(format!(
            r#"/c xcopy "{}" "{}" /E /I /H /Y"#,
            profile_dir.to_string_lossy(),
            clone_dir.to_string_lossy()
        ))
        .status()
        .map_err(|e| format!("Failed to execute xcopy command: {e}"))?;

    if status.success() {
        Ok(clone_dir.file_name().unwrap().to_string_lossy().to_string())
    } else {
        Err(format!(
            "Failed to clone profile: xcopy exited with status {}",
            status
        ))
    }
}

pub fn open_profile_dir(profile_name: &String) -> Result<(), String> {
    let profile_dir = get_profile_dir(profile_name).expect("Couldn't get profile path!");
    println!("Opening profile folder: {}", profile_dir.to_string_lossy());
    match std::process::Command::new("cmd")
        .raw_arg(format!(
            r#"/c start "" "{}""#,
            profile_dir.to_string_lossy()
        ))
        .spawn()
    {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to open profile folder: {e}")),
    }
}
