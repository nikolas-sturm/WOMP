use clap::{Parser, Subcommand};
use std::fs;
use std::process::Command;
use std::os::windows::process::CommandExt;
use womp::ccd::CCDWrapper;
use womp::serde::config::Config;
use womp::{apply_profile_from_file, get_profile_path, read_config, save_current_profile};

#[derive(Parser)]
#[command(author, version, about = "Windows Output Manager Protocol CLI")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Save { profile_name: String },
    Apply { profile_name: String },
}

fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Save { profile_name } => {
            let mut wrapper = CCDWrapper::new(true);

            let profile_dir = match get_profile_path(profile_name) {
                Ok(path) => path,
                Err(e) => {
                    eprintln!("Config path error: {e}");
                    return;
                }
            };

            let profile_file = profile_dir.join("displays.json");

            match save_current_profile(&mut wrapper, &profile_file) {
                Ok(_) => println!("Successfully saved profile: {profile_name}"),
                Err(e) => {
                    eprintln!("Failed to save profile: {e}");
                }
            }
        }
        Commands::Apply { profile_name } => {
            let mut wrapper = CCDWrapper::new(true);

            let profile_dir = match get_profile_path(profile_name) {
                Ok(path) => path,
                Err(e) => {
                    eprintln!("Config path error: {e}");
                    return;
                }
            };
            let profile_file = profile_dir.join("displays.json");
            let config_file = profile_dir.join("config.toml");
            let mut config_exists = fs::exists(&config_file).unwrap();
            let mut config = Config::default();

            'config: {
                if config_exists {
                    config = match read_config(&config_file) {
                        Ok(c) => c,
                        Err(_) => {
                            config_exists = false;
                            break 'config;
                        }
                    };

                    let _output = Command::new("cmd")
                        .raw_arg("/C")
                        .raw_arg(&config.run.before)
                        .output()
                        .expect("Failed to run `before` command.");

                    /* println!("Status: {}", output.status);
                    println!("Stdout: {}", String::from_utf8_lossy(&output.stdout));
                    println!("Stderr: {}", String::from_utf8_lossy(&output.stderr)); */
                }
            }

            match apply_profile_from_file(&mut wrapper, &profile_file) {
                Ok(_) => println!("Successfully applied profile: {profile_name}"),
                Err(e) => {
                    eprintln!("Failed to apply profile: {e}");
                }
            }

            if config_exists {
                let _output = Command::new("cmd")
                    .raw_arg("/C")
                    .raw_arg(&config.run.before)
                    .output()
                    .expect("Failed to run `after` command.");

                /* println!("Status: {}", output.status);
                println!("Stdout: {}", String::from_utf8_lossy(&output.stdout));
                println!("Stderr: {}", String::from_utf8_lossy(&output.stderr)); */
            }
        }
    }
}
