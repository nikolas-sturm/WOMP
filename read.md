# WOMP - Windows Output Manager Protocol

[![Build Status](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/YOUR_REPONAME/rust.yml?branch=main)](https://github.com/YOUR_USERNAME/YOUR_REPONAME/actions)
[![Latest Release](https://img.shields.io/github/v/release/YOUR_USERNAME/YOUR_REPONAME)](https://github.com/YOUR_USERNAME/YOUR_REPONAME/releases)
[![License](https://img.shields.io/github/license/YOUR_USERNAME/YOUR_REPONAME)](LICENSE)
<!-- Add other badges if you have them, e.g., downloads, crate version -->

Effortlessly manage and switch your Windows display configurations with WOMP. Save complex multi-monitor setups as profiles and recall them instantly, complete with custom actions and a modern, theme-aware interface.

**WOMP is a Windows-only application.**

---

## Overview

WOMP (Windows Output Manager Protocol) is a modern display profile manager for Windows, designed as a spiritual successor to the much-loved "Monitor Profile Switcher" by Martin Krämer. If you frequently switch between different monitor arrangements for work, gaming, or media consumption, WOMP is built for you.

It allows you to save your current display settings—including which monitors are enabled/disabled, their resolution, refresh rate, orientation, and virtual positioning—into named profiles. These profiles can then be activated with a click, reconfiguring your entire display setup in seconds.

WOMP goes beyond basic display settings by allowing you to:
*   Assign custom icons to profiles for easy identification.
*   Define arbitrary commands to run *before* and *after* a profile is applied, enabling powerful automation.

Built with Rust for robust backend logic and React with Microsoft's Fluent UI for a beautiful, responsive frontend, WOMP integrates seamlessly with Windows 11 aesthetics, automatically adapting to your system theme and accent color. The primary interaction is through a convenient tray icon, keeping your desktop clutter-free.

## Key Features

*   **Profile Management:** Save and load distinct display configurations.
*   **Comprehensive Settings:** Captures:
    *   Enabled/Disabled state for each monitor.
    *   Resolution.
    *   Refresh Rate.
    *   Orientation (Landscape, Portrait, etc.).
    *   Virtual Position (Primary display, relative positioning).
    *   HDR status, color profiles (planned/potential future enhancements).
*   **Custom Profile Icons:** Visually distinguish your profiles.
*   **Pre & Post-Application Commands:** Execute custom scripts or programs:
    *   Turn on/off smart devices (e.g., TV via SmartThings API).
    *   Launch applications (e.g., Steam Big Picture Mode).
    *   Change audio devices.
    *   And much more!
*   **Modern UI:**
    *   Built with React and Fluent UI (WinUI 3 look and feel).
    *   Adapts to Windows system theme (light/dark) and accent color.
*   **Tray Icon Access:** Quick access to profiles without a persistent window.
*   **Rust Powered:** Efficient and reliable backend logic.
*   **CLI Interface (`womp_cli`):** For scripting and advanced users.

## Why WOMP? - Use Cases

Imagine this common scenario (my personal setup):

I have 4 displays: 3 desk monitors and 1 TV in the next room.

1.  **"Work" Profile:**
    *   Desk monitors 1, 2, & 3 enabled.
    *   TV disabled.
    *   Ideal for productivity.

2.  **"Desk Gaming" Profile:**
    *   Only the central desk monitor enabled (for focus and max FPS).
    *   Desk monitors 1 & 3 disabled.
    *   TV disabled.

3.  **"TV Gaming" Profile:**
    *   **Pre-commands:** Run a Python script to turn on the TV via SmartThings API (Windows needs the TV on to detect it properly).
    *   **Display:** TV enabled (144Hz, "Game Mode" if your TV supports it via a script or utility). All desk monitors disabled.
    *   **Post-commands:** Launch Steam in Big Picture Mode.

4.  **"TV Movie" Profile:**
    *   **Pre-commands:** (Optional) Script to turn on TV if not already on.
    *   **Display:** TV enabled (24Hz, "Movie Mode"). All desk monitors disabled.
    *   **Post-commands:** (Optional) Launch preferred media player.

WOMP makes switching between these complex setups a one-click operation.

## Screenshots

<!-- TODO: Add screenshots here! -->
<!-- Suggestions:
     - Main window showing a list of profiles.
     - Profile editing dialog (showing display settings, icon selection, pre/post commands).
     - Tray icon menu.
     - App in light and dark mode.
-->
*Main Application Window:*
![image](placeholder_main_window.png)

*Profile Configuration:*
![image](placeholder_profile_config.png)

*Tray Menu:*
![image](placeholder_tray_menu.png)

## Installation

1.  Go to the [**Releases**](https://github.com/YOUR_USERNAME/YOUR_REPONAME/releases) page.
2.  Download the latest `.msi` or `.exe` installer for WOMP.
3.  Run the installer and follow the on-screen instructions.

**System Requirements:**
*   Windows 10 or Windows 11.

## Usage

### WOMP GUI (Main Application)

1.  **Launch WOMP:** After installation, launch WOMP from the Start Menu or desktop shortcut. It will typically start minimized to the system tray.
2.  **Tray Icon:**
    *   **Left-click:** Show/hide the main application window.
    *   **Right-click:** Opens a context menu with:
        *   A list of your saved profiles for quick activation.
        *   "Open WOMP" to show the main window.
        *   "Settings" (if any).
        *   "Exit."
3.  **Main Window:**
    *   **Create a New Profile:**
        *   Arrange your displays as desired using Windows Display Settings.
        *   In WOMP, click "Save Current as New Profile."
        *   Give the profile a name.
    *   **Edit a Profile:**
        *   Select a profile and click "Edit."
        *   You can assign a custom icon.
        *   Add commands to be executed before the profile is applied (e.g., `python C:\Scripts\tv_on.py`).
        *   Add commands to be executed after the profile is applied (e.g., `C:\Program Files (x86)\Steam\steam.exe -bigpicture`).
        *   *Note: Currently, display settings themselves are captured from the live system state when saving. Direct editing of resolution/refresh within WOMP's profile editor might be a future feature.*
    *   **Apply a Profile:** Select a profile from the list and click "Apply," or select it from the tray menu.
    *   **Delete a Profile:** Select a profile and click "Delete."

### WOMP CLI (`womp_cli`)

The `womp_cli` executable provides command-line access to WOMP's core functionality. This is useful for scripting or integration with other tools.

```bash
# List available profiles
womp_cli.exe list

# Apply a profile by name
womp_cli.exe apply "TV Gaming"

# Get help
womp_cli.exe --help
```
The `womp_cli.exe` will be located in the installation directory of WOMP. You might want to add this directory to your system's PATH for easier access.

## Project Structure

The WOMP project is organized into the following crates:

*   `womp/`: The core Rust library crate. It handles all the logic for detecting displays, saving/loading profiles, and applying display configurations using Windows APIs.
*   `womp_cli/`: A Rust crate that provides a command-line interface for interacting with the `womp` library.
*   `womp_gui/`: The main graphical user interface, built using Tauri (which bundles a Rust backend with a web frontend) and React with Fluent UI components.

## Building from Source

If you wish to build WOMP from source, you'll need:

*   **Rust:** Install from [rustup.rs](https://rustup.rs/).
*   **Node.js and npm/yarn:** Install from [nodejs.org](https://nodejs.org/).
*   **Tauri Prerequisites:** Follow the Tauri setup guide for Windows: [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites#windows). This typically involves installing Microsoft Visual Studio C++ Build Tools and WebView2.

**1. Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPONAME.git
cd YOUR_REPONAME
```

**2. Build `womp` library (optional, usually built as a dependency):**
```bash
cd womp
cargo build --release
cd ..
```

**3. Build `womp_cli`:**
```bash
cd womp_cli
cargo build --release
# The executable will be in target/release/womp_cli.exe
cd ..
```

**4. Build `womp_gui`:**
```bash
cd womp_gui
npm install  # or yarn install
npm run tauri build # or yarn tauri build
# The installer/executable will be in src-tauri/target/release/bundle/
cd ..
```

## Contributing

Contributions are welcome! Whether it's bug reports, feature requests, or code contributions, please feel free to:

1.  Check for existing issues or open a new issue to discuss your ideas.
2.  Fork the repository.
3.  Create a new branch for your feature or bug fix (`git checkout -b feature/your-feature-name`).
4.  Make your changes and commit them.
5.  Push your branch to your fork (`git push origin feature/your-feature-name`).
6.  Create a Pull Request against the `main` branch of this repository.

Please ensure your code adheres to existing styling and that Rust code is formatted with `cargo fmt`.

## Inspiration & Acknowledgements

*   **Monitor Profile Switcher by Martin Krämer:** The original inspiration for this project. A fantastic tool that served many for years. [View on SourceForge](https://sourceforge.net/projects/monitorswitcher/).
*   The Rust, Tauri, and React communities for their excellent tools and libraries.

## License

This project is licensed under the [YOUR_CHOSEN_LICENSE - e.g., MIT License or Apache 2.0] - see the [LICENSE](LICENSE) file for details.
(If you don't have one, MIT is a good permissive choice: `https://opensource.org/licenses/MIT`)

---

*Made with ❤️ for all Windows multi-monitor users.*