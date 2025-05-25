#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use windows::Win32::Devices::Display::{
    DISPLAYCONFIG_ADAPTER_NAME, DISPLAYCONFIG_MODE_INFO, DISPLAYCONFIG_PATH_INFO,
    DISPLAYCONFIG_TARGET_DEVICE_NAME,
};
pub mod config;
pub mod optional_info;
pub mod global_config;
pub mod win32_additional_info;
pub mod win32_bool;
pub mod win32_i32_tuple_struct;
pub mod win32_luid;
pub mod win32_mode_info;
pub mod win32_path_info;
pub mod win32_pointl;
pub mod win32_rational;
pub mod win32_region;
pub mod win32_video_signal_info_union;
pub mod win32_widestring;

#[derive(Serialize, Deserialize)]
pub struct Display {
    #[serde(with = "win32_path_info::PathInfoDef")]
    pub pathInfo: DISPLAYCONFIG_PATH_INFO,
    pub modeInfo: win32_mode_info::ModeInfo,
    pub additionalInfo: win32_additional_info::AdditionalInfo,
    #[serde(skip_serializing_if = "optional_info::OptionalInfo::is_empty")]
    pub optionalInfo: optional_info::OptionalInfo,
}

impl Display {
    pub fn from(
        path: &DISPLAYCONFIG_PATH_INFO,
        target_mode: &DISPLAYCONFIG_MODE_INFO,
        source_mode: &DISPLAYCONFIG_MODE_INFO,
        target_name: &DISPLAYCONFIG_TARGET_DEVICE_NAME,
        adapter_name: &DISPLAYCONFIG_ADAPTER_NAME,
        optional_info: &optional_info::OptionalInfo,
    ) -> Self {
        Display {
            pathInfo: *path,
            modeInfo: win32_mode_info::ModeInfo {
                sourceModeInfo: *source_mode,
                targetModeInfo: *target_mode,
            },
            additionalInfo: win32_additional_info::AdditionalInfo {
                target: *target_name,
                adapter: *adapter_name,
            },
            optionalInfo: *optional_info,
        }
    }

    pub fn to_windows_types(
        &self,
    ) -> (
        DISPLAYCONFIG_PATH_INFO,
        DISPLAYCONFIG_MODE_INFO,
        DISPLAYCONFIG_MODE_INFO,
        DISPLAYCONFIG_TARGET_DEVICE_NAME,
        DISPLAYCONFIG_ADAPTER_NAME,
    ) {
        (
            self.pathInfo,
            self.modeInfo.targetModeInfo,
            self.modeInfo.sourceModeInfo,
            self.additionalInfo.target,
            self.additionalInfo.adapter,
        )
    }
}

#[derive(Serialize, Deserialize)]
pub struct WallpaperInfo {
    pub wallpaperPath: String,
    pub wallpaperPosition: String,
}

#[derive(Serialize, Deserialize)]
pub struct GlobalInfo {
    pub iconSize: Option<i32>,
    pub wallpaperInfo: Option<WallpaperInfo>,
}

impl GlobalInfo {
    pub fn from(iconSize: Option<i32>, wallpaperInfo: Option<WallpaperInfo>) -> Self {
        GlobalInfo { iconSize, wallpaperInfo }
    }
}

#[derive(Serialize, Deserialize)]
pub struct DisplayLayout {
    pub globalInfo: GlobalInfo,
    pub displays: Vec<Display>,
}

impl DisplayLayout {
    pub fn from(displays: Vec<Display>, globalInfo: GlobalInfo) -> Self {
        DisplayLayout { globalInfo, displays }
    }
}