use clap::{Parser, Subcommand};
use womp::ccd::CCDWrapper;
use womp::{apply_profile_from_file, get_profile_path, save_current_profile};

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
            let profile_path = match get_profile_path(profile_name) {
                Ok(path) => path,
                Err(e) => {
                    eprintln!("Config path error: {e}");
                    return;
                }
            };

            let mut wrapper = CCDWrapper::new(true);

            match save_current_profile(&mut wrapper, &profile_path) {
                Ok(_) => println!("Successfully saved profile: {profile_name}"),
                Err(e) => {
                    eprintln!("Failed to save profile: {e}");
                }
            }
        }
        Commands::Apply { profile_name } => {
            let profile_path = match get_profile_path(profile_name) {
                Ok(path) => path,
                Err(e) => {
                    eprintln!("Config path error: {e}");
                    return;
                }
            };

            let mut wrapper = CCDWrapper::new(true);

            match apply_profile_from_file(&mut wrapper, &profile_path) {
                Ok(_) => println!("Successfully applied profile: {profile_name}"),
                Err(e) => {
                    eprintln!("Failed to apply profile: {e}");
                }
            }
        }
    }
}
