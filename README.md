# WOMP (Windows Output Manager Protocol)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

WOMP is a modern Windows display profile manager written in Rust, allowing you to save and switch between different display configurations with ease. It's a spiritual successor to [Monitor Profile Switcher](https://sourceforge.net/projects/monitorswitcher/) by Martin Krämer, reimagined with modern technologies.

![WOMP Screenshot](https://via.placeholder.com/800x450.png?text=WOMP+Screenshot)

## Features

- **Save & Load Display Profiles**: Save your current display configuration and switch between profiles easily
- **Complete Display Management**: Control enabled/disabled state, resolution, refresh rate, and virtual positioning of each display
- **Beautiful Modern UI**: Built with Tauri and React using FluentUI components - perfectly integrating with Windows 11's design language
- **System Integration**: Runs in the system tray for easy access
- **Custom Actions**: Run arbitrary commands before and after applying profiles
- **Profile Customization**: Add custom icons to your profiles for easy identification

## Use Cases

WOMP is perfect for users who regularly switch between different display configurations:

- **Work/Gaming Setup**: Switch between a multi-monitor productivity setup and a single gaming monitor
- **Presentation Mode**: Quickly configure displays for presentations
- **TV/Media Setup**: Configure displays for optimal media viewing experience
- **Home Office/Entertainment**: Seamlessly transition between work and entertainment display configurations

### Real-world Example

A typical use case involves managing multiple displays:
- 3 desk monitors for regular work
- Single monitor gaming setup (for fewer distractions and better performance)
- TV output for gaming with 144Hz refresh rate
- TV output for movies with 24Hz refresh rate and movie mode

With WOMP, you can create profiles for each scenario and switch between them with a single click!

## Installation

Download the latest installer from the [releases page](https://github.com/nikolas-sturm/womp/releases).

WOMP is Windows-only and requires Windows 10 or later.

## Usage

### Basic Usage

1. **System Tray Access**: WOMP runs in your system tray for easy access
2. **Save Current Configuration**: Right-click the tray icon → Save Current Layout → Enter Profile Name
3. **Load Configuration**: Right-click the tray icon → Select a profile to apply

### Advanced Usage

#### Custom Commands

WOMP allows you to run custom commands before and after applying a profile:

1. Open the WOMP GUI
2. Select a profile to edit
3. Add commands to run before/after applying the profile

Example: Turn on a smart TV via API before enabling its display, then launch Steam Big Picture mode after the display is configured.

#### Profile Customization

Personalize your profiles with custom icons and descriptive names for easy identification.

## Command Line Interface

WOMP includes a CLI for power users:

```
womp_cli save <profile_name>   # Save the current layout to a profile
womp_cli apply <profile_name>  # Apply a saved profile
womp_cli list                  # List all available profiles
```

## Building from Source

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Node.js](https://nodejs.org/) (v22+)
- [Cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html)
- Windows 10/11

### Build Steps

1. Clone the repository
   ```
   git clone https://github.com/nikolas-sturm/womp.git
   cd womp
   ```

2. Build the project
   ```
   cargo build --release
   ```

3. Build the GUI
   ```
   cd crates/womp_gui
   npm install
   npm run tauri build
   ```

The compiled binaries will be available in the `target/release` directory.

## Project Structure

- **womp**: Core library containing the display management functionality
- **womp_cli**: Command-line interface for basic interactions
- **womp_gui**: Tauri/React application providing a modern GUI experience

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Monitor Profile Switcher](https://sourceforge.net/projects/monitorswitcher/) by Martin Krämer for the original inspiration
- [Tauri](https://tauri.app/) for the excellent cross-platform framework
- [FluentUI](https://react.fluentui.dev/) for the beautiful Windows-native UI components
