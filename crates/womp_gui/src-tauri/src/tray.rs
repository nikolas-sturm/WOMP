use tauri::{
    App,
    menu::{MenuBuilder, MenuItem, SubmenuBuilder},
    tray::{TrayIcon, TrayIconBuilder},
};
use womp::config_manager::get_profiles_and_configs;

pub fn create_tray(app: &mut App) -> TrayIcon {
    let profiles = get_profiles_and_configs().unwrap();
    let mut profile_items = Vec::new();
    for (profile_name, config) in &profiles {
        let icon = config.icon.clone();
        let name = if config.name.is_empty() {
            profile_name.clone()
        } else {
            config.name.clone()
        };
        let item = MenuItem::with_id(
            app,
            &format!("apply_profile_{}", profile_name),
            &format!("{} {}", icon, name),
            true,
            None::<&str>,
        )
        .unwrap();
        profile_items.push(item);
    }
    let apply_profile_submenu = SubmenuBuilder::new(app, "⚙️ Apply Profile")
        .items(
            &profile_items
                .iter()
                .map(|item| item as &dyn tauri::menu::IsMenuItem<_>)
                .collect::<Vec<_>>(),
        )
        .build()
        .unwrap();
    let menu = MenuBuilder::new(app)
        .item(&apply_profile_submenu)
        .build()
        .unwrap();

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(true)
        .build(app)
        .unwrap()
}
