use clap::{Parser, Subcommand};
use womp::{apply_display_layout, get_global_config, get_profiles, save_current_display_layout};

#[derive(Parser)]
#[command(author, version, about = "Windows Output Manager Protocol CLI")]
struct Cli {
    /// Enable debug mode
    #[arg(short, long, global = true)]
    debug: bool,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Save the current profile as <PROFILE_NAME>
    #[command(arg_required_else_help = true)]
    Save { profile_name: String },
    /// Apply the profile named <PROFILE_NAME>
    #[command(arg_required_else_help = true)]
    Apply {
        profile_name: String,
        /// Whether to run commands defined in profile.toml after applying
        #[arg(short, long, default_value_t = true)]
        run: bool,
    },
    /// List all profiles
    List,
}

fn main() {
    let cli = Cli::parse();

    let global_config = get_global_config();

    match &cli.command {
        Commands::Save { profile_name } => {
            match save_current_display_layout(profile_name, &global_config, cli.debug) {
                Ok(_) => println!("Successfully saved display layout: {profile_name}"),
                Err(e) => {
                    eprintln!("Failed to save display layout: {e}");
                }
            }
        }
        Commands::Apply { profile_name, run } => {
            match apply_display_layout(profile_name, *run, &global_config, cli.debug) {
                Ok(_) => println!("Successfully applied display layout: {profile_name}"),
                Err(e) => {
                    eprintln!("Failed to apply display layout: {e}");
                }
            }
        }
        Commands::List => match get_profiles() {
            Ok(profiles) => {
                for (name, profile) in profiles {
                    if let Some(profile) = profile {
                        println!("- `{}`: {}", name, profile.description);
                    } else {
                        println!("- \"{name}\"");
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to list profiles: {e}");
            }
        },
    }
}
