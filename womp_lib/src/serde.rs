#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use windows::Win32::Devices::Display::{
    DISPLAYCONFIG_ADAPTER_NAME, DISPLAYCONFIG_MODE_INFO, DISPLAYCONFIG_PATH_INFO,
    DISPLAYCONFIG_TARGET_DEVICE_NAME,
};
pub mod win32_additional_info;
pub mod win32_bool;
pub mod win32_i32_tuple_struct;
pub mod win32_luid;
pub mod win32_mode_info;
pub mod win32_path_info;
pub mod win32_pointl;
pub mod win32_rational;
pub mod win32_region;
pub mod win32_widestring;

#[derive(Serialize, Deserialize)]
pub struct Display {
    #[serde(with = "win32_path_info::PathInfoDef")]
    pub pathInfo: DISPLAYCONFIG_PATH_INFO,
    pub modeInfo: win32_mode_info::ModeInfo,
    pub additionalInfo: win32_additional_info::AdditionalInfo,
}

impl Display {
    pub fn from(
        path: &DISPLAYCONFIG_PATH_INFO,
        target_mode: &DISPLAYCONFIG_MODE_INFO,
        source_mode: &DISPLAYCONFIG_MODE_INFO,
        target_name: &DISPLAYCONFIG_TARGET_DEVICE_NAME,
        adapter_name: &DISPLAYCONFIG_ADAPTER_NAME,
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
