#![allow(non_snake_case)]

use crate::serde_types::win32_i32_tuple_struct::*;
use crate::serde_types::win32_luid;
use crate::serde_types::win32_pointl;
use crate::serde_types::win32_rational;
use crate::serde_types::win32_region;
use crate::serde_types::win32_video_signal_info_union::Win32VideoSignalInfoUnion;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use windows::Win32::Devices::Display::DISPLAYCONFIG_MODE_INFO;
use windows::Win32::Devices::Display::*;
use windows::Win32::Foundation::LUID as Win32LUID;
use windows::Win32::Foundation::POINTL;

#[derive(Serialize, Deserialize)]
pub struct ModeInfo {
    #[serde(with = "ModeInfoDef")]
    pub sourceModeInfo: DISPLAYCONFIG_MODE_INFO,
    #[serde(with = "ModeInfoDef")]
    pub targetModeInfo: DISPLAYCONFIG_MODE_INFO,
}

#[derive(Serialize, Deserialize)]
#[serde(remote = "DISPLAYCONFIG_VIDEO_SIGNAL_INFO")]
pub struct VideoSignalInfo {
    pub pixelRate: u64,
    #[serde(with = "win32_rational")]
    pub hSyncFreq: DISPLAYCONFIG_RATIONAL,
    #[serde(with = "win32_rational")]
    pub vSyncFreq: DISPLAYCONFIG_RATIONAL,
    #[serde(with = "win32_region")]
    pub activeSize: DISPLAYCONFIG_2DREGION,
    #[serde(with = "win32_region")]
    pub totalSize: DISPLAYCONFIG_2DREGION,
    #[serde(with = "Win32VideoSignalInfoUnion")]
    pub Anonymous: DISPLAYCONFIG_VIDEO_SIGNAL_INFO_0,
    #[serde(with = "win32_scanline")]
    pub scanLineOrdering: DISPLAYCONFIG_SCANLINE_ORDERING,
}

#[derive(Serialize, Deserialize)]
pub struct TargetModeSerdeRepr {
    #[serde(with = "VideoSignalInfo")]
    targetVideoSignalInfo: DISPLAYCONFIG_VIDEO_SIGNAL_INFO,
}

#[derive(Serialize, Deserialize)]
pub struct SourceModeSerdeRepr {
    pub width: u32,
    pub height: u32,
    #[serde(with = "win32_pixel_format")]
    pub pixelFormat: DISPLAYCONFIG_PIXELFORMAT,
    #[serde(with = "win32_pointl")]
    pub position: POINTL,
}

#[derive(Serialize, Deserialize)]
struct ModeInfoSerializationHelper {
    #[serde(with = "win32_mode_info_type")]
    infoType: DISPLAYCONFIG_MODE_INFO_TYPE, // Field names can be same as ModeInfoDef
    id: u32,
    #[serde(with = "win32_luid")]
    adapterId: Win32LUID,

    #[serde(skip_serializing_if = "Option::is_none")]
    targetMode: Option<TargetModeSerdeRepr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    sourceMode: Option<SourceModeSerdeRepr>,
}

pub struct ModeInfoDef;

impl ModeInfoDef {
    pub fn serialize<S>(
        mode_info: &DISPLAYCONFIG_MODE_INFO,
        serializer: S,
    ) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let (targetMode, sourceMode) = unsafe {
            match mode_info.infoType {
                DISPLAYCONFIG_MODE_INFO_TYPE_TARGET => {
                    let targetMode = TargetModeSerdeRepr {
                        targetVideoSignalInfo: mode_info.Anonymous.targetMode.targetVideoSignalInfo,
                    };
                    (Some(targetMode), None)
                }
                DISPLAYCONFIG_MODE_INFO_TYPE_SOURCE => {
                    let sourceInfo: DISPLAYCONFIG_SOURCE_MODE = mode_info.Anonymous.sourceMode;
                    let sourceMode = SourceModeSerdeRepr {
                        width: sourceInfo.width,
                        height: sourceInfo.height,
                        pixelFormat: sourceInfo.pixelFormat,
                        position: sourceInfo.position,
                    };
                    (None, Some(sourceMode))
                }
                _ => (None, None),
            }
        };

        let helper = ModeInfoSerializationHelper {
            infoType: mode_info.infoType, // These are Copy
            id: mode_info.id,
            adapterId: mode_info.adapterId,
            targetMode,
            sourceMode,
        };
        helper.serialize(serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<DISPLAYCONFIG_MODE_INFO, D::Error>
    where
        D: Deserializer<'de>,
    {
        let helper = ModeInfoSerializationHelper::deserialize(deserializer)?;

        let mut mode_info = DISPLAYCONFIG_MODE_INFO {
            infoType: helper.infoType,
            id: helper.id,
            adapterId: helper.adapterId,
            Anonymous: unsafe { std::mem::zeroed() },
        };

        unsafe {
            match helper.infoType {
                DISPLAYCONFIG_MODE_INFO_TYPE_TARGET => {
                    if let Some(target_mode) = helper.targetMode {
                        mode_info.Anonymous.targetMode.targetVideoSignalInfo =
                            target_mode.targetVideoSignalInfo;
                    }
                }
                DISPLAYCONFIG_MODE_INFO_TYPE_SOURCE => {
                    if let Some(source_mode) = helper.sourceMode {
                        let source_info = &mut mode_info.Anonymous.sourceMode;
                        source_info.width = source_mode.width;
                        source_info.height = source_mode.height;
                        source_info.pixelFormat = source_mode.pixelFormat;
                        source_info.position = source_mode.position;
                    }
                }
                _ => {}
            }
        }

        Ok(mode_info)
    }
}
