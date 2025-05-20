#![allow(non_snake_case)]

use crate::serde_types::win32_i32_tuple_struct::{win32_device_info_type, win32_output};
use crate::serde_types::win32_luid;
use crate::serde_types::win32_widestring;
use serde::{Deserialize, Serialize};
use windows::Win32::{Devices::Display::*, Foundation::LUID};

#[derive(Serialize, Deserialize)]
#[serde(remote = "DISPLAYCONFIG_DEVICE_INFO_HEADER")]
pub struct DeviceInfoHeaderDef {
    #[serde(with = "win32_device_info_type")]
    r#type: DISPLAYCONFIG_DEVICE_INFO_TYPE,
    size: u32,
    #[serde(with = "win32_luid")]
    adapterId: LUID,
    id: u32,
}

#[derive(Serialize, Deserialize)]
#[serde(remote = "DISPLAYCONFIG_TARGET_DEVICE_NAME")]
pub struct TargetNameDef {
    #[serde(with = "DeviceInfoHeaderDef")]
    header: DISPLAYCONFIG_DEVICE_INFO_HEADER,
    #[serde(skip)]
    #[serde(default)]
    flags: (),
    #[serde(with = "win32_output")]
    outputTechnology: DISPLAYCONFIG_VIDEO_OUTPUT_TECHNOLOGY,
    edidManufactureId: u16,
    edidProductCodeId: u16,
    connectorInstance: u32,
    #[serde(with = "win32_widestring")]
    monitorFriendlyDeviceName: [u16; 64],
    #[serde(with = "win32_widestring")]
    monitorDevicePath: [u16; 128],
}

#[derive(Serialize, Deserialize)]
#[serde(remote = "DISPLAYCONFIG_ADAPTER_NAME")]
pub struct AdapterNameDef {
    #[serde(with = "DeviceInfoHeaderDef")]
    header: DISPLAYCONFIG_DEVICE_INFO_HEADER,
    #[serde(with = "win32_widestring")]
    adapterDevicePath: [u16; 128],
}

#[derive(Serialize, Deserialize)]
pub struct AdditionalInfo {
    #[serde(with = "TargetNameDef")]
    pub target: DISPLAYCONFIG_TARGET_DEVICE_NAME,
    #[serde(with = "AdapterNameDef")]
    pub adapter: DISPLAYCONFIG_ADAPTER_NAME,
}
