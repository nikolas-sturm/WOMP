use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct GlobalConfig {
    pub autostart: bool,
    pub theme: String,
    pub save_dpi_scale: bool,
    pub save_icon_size: bool,
    pub save_hdr_state: bool,
    pub save_sdr_white_level: bool,
    pub save_wallpaper_info: bool,
}

impl GlobalConfig {
    pub fn new() -> Self {
        Self {
            autostart: false,
            theme: "system".to_string(),
            save_dpi_scale: false,
            save_icon_size: false,
            save_hdr_state: false,
            save_sdr_white_level: false,
            save_wallpaper_info: false,
        }
    }
}
