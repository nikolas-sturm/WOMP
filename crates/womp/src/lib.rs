use ccd_manager::CCDWrapper;
use config_manager::*;
use serde_types::Display;
use serde_types::config::Config;
use std::{fs, io::BufReader, os::windows::process::CommandExt, process::Command};

pub mod ccd_manager;
pub mod serde_types;
pub mod config_manager;

pub fn save_current_display_layout(
    profile_name: &String,
    debug: bool,
) -> Result<(), String> {
    let mut wrapper = CCDWrapper::new(true, debug);

    let display_layout_file = get_display_layout_file_path(profile_name).unwrap();
    fs::create_dir_all(display_layout_file.parent().unwrap()).unwrap();

    let result = wrapper.get_displays();
    if debug {
        println!("Retrieved {} displays", result.as_ref().unwrap().len());
    }
    match result {
        Ok(ref displays) => {
            let serialized = serde_json::to_string_pretty(displays).unwrap();
            fs::write(display_layout_file, serialized).map_err(|e| format!("Failed to save display layout: {e}"))
        }
        Err(ref e) => {
            return Err(format!("Failed to retrieve displays: {e}"));
        }
    }
}

pub fn apply_display_layout(
    profile_name: &String,
    run_commands: bool,
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
                .raw_arg(&config.run.before)
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
    let display_layout_file = fs::File::open(&display_layout_file)
        .map_err(|e| format!("Couldn't open display layout at {:?}: {}", &display_layout_file, e))?;
    let display_layout_reader = BufReader::new(&display_layout_file);
    let mut display_layout: Vec<Display> = serde_json::from_reader(display_layout_reader)
        .map_err(|e| format!("Couldn't parse JSON from {:?}: {}", display_layout_file, e))?;
    
    match wrapper.apply_display_layout(&mut display_layout) {
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
            .raw_arg(&config.run.after)
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