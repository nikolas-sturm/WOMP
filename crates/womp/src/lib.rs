use ccd_manager::CCDWrapper;
use config_manager::*;
use serde_types::config::Config;
use serde_types::{DisplayLayout, global_config::GlobalConfig};
use std::{fs, io::BufReader, os::windows::process::CommandExt, process::Command};
pub mod ccd_manager;
pub mod config_manager;
pub mod serde_types;

pub fn get_global_config() -> GlobalConfig {
    let global_config_file = get_config_dir().unwrap().join("settings.toml");
    // create file if it doesn't exist
    if !global_config_file.exists() {
        fs::create_dir_all(get_config_dir().unwrap()).unwrap();
        fs::write(&global_config_file, toml::to_string(&GlobalConfig::new()).unwrap())
            .unwrap();
    }
    let global_config = match fs::read_to_string(&global_config_file) {
        Ok(s) => toml::from_str(&s)
            .map_err(|e| format!("Failed to parse global config: {e}"))
            .unwrap(),
        Err(_) => GlobalConfig::new(),
    };
    global_config
}

pub fn set_global_config(global_config: &GlobalConfig) -> Result<(), String> {
    let global_config_file = get_config_dir().unwrap().join("settings.toml");
    fs::write(global_config_file, toml::to_string(global_config).unwrap())
        .map_err(|e| format!("Failed to save global config: {e}"))
}

pub fn get_active_profile(global_config: &GlobalConfig) -> Result<Option<String>, String> {
    let mut wrapper = CCDWrapper::new(true, false);
    let current_display_layout = wrapper.get_display_layout(global_config).unwrap();
    let current_display_layout = serde_json::to_string(&current_display_layout).unwrap();
    let profiles = get_profiles_and_configs().unwrap();
    let profiles: Vec<String> = profiles
        .into_iter()
        .map(|(name, _)| name)
        .collect();
    let saved_layouts: Vec<(String, DisplayLayout)> = profiles.iter().map(|profile| {
        let display_layout_file = get_display_layout_file_path(profile).unwrap();
        let display_layout = fs::read_to_string(display_layout_file).unwrap();
        let display_layout: DisplayLayout = serde_json::from_str(&display_layout).unwrap();
        (profile.clone(), display_layout)
    }).collect();
    for (profile, saved_layout) in saved_layouts {
        let saved_layout = serde_json::to_string(&saved_layout).unwrap();
        if saved_layout == current_display_layout {
            return Ok(Some(profile));
        }
    }
    Ok(None)
}

pub fn save_current_display_layout(
    profile_name: &String,
    global_config: &GlobalConfig,
    debug: bool,
) -> Result<(), String> {
    let mut wrapper = CCDWrapper::new(true, debug);

    let display_layout_file = get_display_layout_file_path(profile_name).unwrap();
    fs::create_dir_all(display_layout_file.parent().unwrap()).unwrap();

    let result = wrapper.get_display_layout(global_config);
    if debug {
        println!("Retrieved {} displays", result.as_ref().unwrap().displays.len());
    }
    match result {
        Ok(ref display_layout) => {
            let serialized = serde_json::to_string_pretty(display_layout).unwrap();
            fs::write(display_layout_file, serialized)
                .map_err(|e| format!("Failed to save display layout: {e}"))
        }
        Err(ref e) => {
            return Err(format!("Failed to retrieve displays: {e}"));
        }
    }
}

pub fn apply_display_layout(
    profile_name: &String,
    run_commands: bool,
    global_config: &GlobalConfig,
    debug: bool,
) -> Result<(), String> {
    let mut wrapper = CCDWrapper::new(true, debug);

    let config_file = get_config_file_path(profile_name).unwrap();
    let display_layout_file = get_display_layout_file_path(profile_name).unwrap();
    let mut config_exists = fs::exists(&config_file).unwrap();
    let mut config = Config::default();

    // Load config if it exists
    if config_exists {
        config = match read_display_config(&profile_name) {
            Ok(c) => c,
            Err(_) => {
                config_exists = false;
                Config::default()
            }
        };

        // Run "before" commands if enabled
        if run_commands && !config.run.is_empty() {
            let output = Command::new("cmd")
                .raw_arg("/C")
                .raw_arg(&config.run.before.target)
                .raw_arg(&config.run.before.args)
                .output()
                .expect("Failed to run `before` command.");

            if debug {
                println!("Running before command...");
                println!("Status: `{}`", output.status);
                println!("Stdout: `{}`", String::from_utf8_lossy(&output.stdout));
                println!("Stderr: `{}`", String::from_utf8_lossy(&output.stderr));
            }
        }

        if !config.name.is_empty() {
            println!("Applying profile `{}`...", config.name);
        } else {
            println!("Applying profile `{}`...", profile_name);
        }
    }

    // Apply display layout
    let display_layout_file = fs::File::open(&display_layout_file).map_err(|e| {
        format!(
            "Couldn't open display layout at {:?}: {}",
            &display_layout_file, e
        )
    })?;
    let display_layout_reader = BufReader::new(&display_layout_file);
    let mut display_layout: DisplayLayout = serde_json::from_reader(display_layout_reader)
        .map_err(|e| format!("Couldn't parse JSON from {:?}: {}", display_layout_file, e))?;

    match wrapper.apply_display_layout(&mut display_layout, global_config) {
        Ok(_) => println!(
            "Successfully applied profile: `{}`",
            if config_exists && !config.name.is_empty() {
                &config.name
            } else {
                profile_name
            }
        ),
        Err(e) => {
            eprintln!("Failed to apply profile: {e}");
            return Err(e);
        }
    }

    // Run "after" commands if enabled
    if run_commands && config_exists && !config.run.is_empty() {
        let output = Command::new("cmd")
            .raw_arg("/C")
            .raw_arg(&config.run.after.target)
            .raw_arg(&config.run.after.args)
            .output()
            .expect("Failed to run `after` command.");

        if debug {
            println!("Running after command...");
            println!("Status: `{}`", output.status);
            println!("Stdout: `{}`", String::from_utf8_lossy(&output.stdout));
            println!("Stderr: `{}`", String::from_utf8_lossy(&output.stderr));
        }
    }

    Ok(())
}

pub fn turn_off_all_displays(debug: bool) -> Result<(), String> {
    let mut wrapper = CCDWrapper::new(true, debug);
    wrapper.turn_off_all_displays()
}

pub fn get_profiles() -> Result<Vec<(String, Option<Config>)>, String> {
    let profiles = get_profiles_and_configs().unwrap();
    Ok(profiles)
}