use crate::serde::win32_bool;
use crate::serde::win32_i32_tuple_struct::*;
use crate::serde::win32_luid;
use crate::serde::win32_rational;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use windows::Win32::Devices::Display::*;
use windows::Win32::Foundation::LUID as Win32LUID;
use windows::core::BOOL;

#[derive(Serialize, Deserialize)]
pub struct SourceInfoHelper {
    #[serde(with = "win32_luid")]
    pub adapterId: Win32LUID,
    pub id: u32,
    pub statusFlags: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub modeInfoIdx: Option<u32>,
}

pub struct SourceInfoDef;

impl SourceInfoDef {
    pub fn serialize<S>(
        source_info: &DISPLAYCONFIG_PATH_SOURCE_INFO,
        serializer: S,
    ) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let modeInfoIdx = unsafe {
            // 8 = DISPLAYCONFIG_PATH_SUPPORT_VIRTUAL_MODE
            if source_info.statusFlags & 8 == 0 {
                Some(source_info.Anonymous.modeInfoIdx)
            } else {
                None // return None if virtual
            }
        };

        let helper = SourceInfoHelper {
            adapterId: source_info.adapterId,
            id: source_info.id,
            statusFlags: source_info.statusFlags,
            modeInfoIdx
        };
        helper.serialize(serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<DISPLAYCONFIG_PATH_SOURCE_INFO, D::Error>
    where
        D: Deserializer<'de>,
    {
        let helper = SourceInfoHelper::deserialize(deserializer)?;

        let mut source_info = DISPLAYCONFIG_PATH_SOURCE_INFO {
            adapterId: helper.adapterId,
            id: helper.id,
            statusFlags: helper.statusFlags,
            Anonymous: unsafe { std::mem::zeroed() },
        };

        // Set modeInfoIdx if available
        if let Some(idx) = helper.modeInfoIdx {
            source_info.Anonymous.modeInfoIdx = idx;
        }

        Ok(source_info)
    }
}

#[derive(Serialize, Deserialize)]
pub struct TargetInfoHelper {
    #[serde(with = "win32_luid")]
    pub adapterId: Win32LUID,
    pub id: u32,
    #[serde(with = "win32_output")]
    pub outputTechnology: DISPLAYCONFIG_VIDEO_OUTPUT_TECHNOLOGY,
    #[serde(with = "win32_rotation")]
    pub rotation: DISPLAYCONFIG_ROTATION,
    #[serde(with = "win32_scaling")]
    pub scaling: DISPLAYCONFIG_SCALING,
    #[serde(with = "win32_rational")]
    pub refreshRate: DISPLAYCONFIG_RATIONAL,
    #[serde(with = "win32_scanline")]
    pub scanLineOrdering: DISPLAYCONFIG_SCANLINE_ORDERING,
    #[serde(with = "win32_bool")]
    pub targetAvailable: BOOL,
    pub statusFlags: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub modeInfoIdx: Option<u32>,
}

pub struct TargetInfoDef;

impl TargetInfoDef {
    pub fn serialize<S>(
        target_info: &DISPLAYCONFIG_PATH_TARGET_INFO,
        serializer: S,
    ) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let modeInfoIdx = unsafe {
            // 8 = DISPLAYCONFIG_PATH_SUPPORT_VIRTUAL_MODE
            if target_info.statusFlags & 8 == 0 {
                Some(target_info.Anonymous.modeInfoIdx)
            } else {
                None // return None if virtual
            }
        };

        let helper = TargetInfoHelper {
            adapterId: target_info.adapterId,
            id: target_info.id,
            outputTechnology: target_info.outputTechnology,
            rotation: target_info.rotation,
            scaling: target_info.scaling,
            refreshRate: target_info.refreshRate,
            scanLineOrdering: target_info.scanLineOrdering,
            targetAvailable: target_info.targetAvailable,
            statusFlags: target_info.statusFlags,
            modeInfoIdx,
        };
        helper.serialize(serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<DISPLAYCONFIG_PATH_TARGET_INFO, D::Error>
    where
        D: Deserializer<'de>,
    {
        let helper = TargetInfoHelper::deserialize(deserializer)?;

        let mut target_info = DISPLAYCONFIG_PATH_TARGET_INFO {
            adapterId: helper.adapterId,
            id: helper.id,
            outputTechnology: helper.outputTechnology,
            rotation: helper.rotation,
            scaling: helper.scaling,
            refreshRate: helper.refreshRate,
            scanLineOrdering: helper.scanLineOrdering,
            targetAvailable: helper.targetAvailable,
            statusFlags: helper.statusFlags,
            Anonymous: unsafe { std::mem::zeroed() },
        };

        // Set modeInfoIdx if available
        if let Some(idx) = helper.modeInfoIdx {
            target_info.Anonymous.modeInfoIdx = idx;
        }

        Ok(target_info)
    }
}

#[derive(Serialize, Deserialize)]
#[serde(remote = "DISPLAYCONFIG_PATH_INFO")]
pub struct PathInfoDef {
    #[serde(with = "SourceInfoDef")]
    sourceInfo: DISPLAYCONFIG_PATH_SOURCE_INFO,
    #[serde(with = "TargetInfoDef")]
    targetInfo: DISPLAYCONFIG_PATH_TARGET_INFO,
    flags: u32,
}
