use serde::{Deserialize, Serialize};
use windows::Win32::Devices::Display::DISPLAYCONFIG_PATH_INFO;

#[derive(Serialize, Deserialize, Debug)]
struct LUID {
    low_part: u32,
    high_part: i32,
}

#[derive(Serialize, Deserialize, Debug)]
struct RefreshRate {
    numerator: u32,
    denominator: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct SourceInfo {
    adapter_id: LUID,
    id: u32,
    status_flags: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct TargetInfo {
    adapter_id: LUID,
    id: u32,
    output_technology: i32,
    rotation: i32,
    scaling: i32,
    refresh_rate: RefreshRate,
    scan_line_ordering: i32,
    target_available: bool,
    status_flags: u32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Display {
    source: SourceInfo,
    target: TargetInfo,
}

impl Display {
    pub fn from(path: DISPLAYCONFIG_PATH_INFO) -> Self {
        let raw_source = path.sourceInfo;
        let raw_target = path.targetInfo;

        let source = SourceInfo {
            adapter_id: LUID {
                high_part: raw_source.adapterId.HighPart,
                low_part: raw_source.adapterId.LowPart,
            },
            id: raw_source.id,
            status_flags: raw_source.statusFlags,
        };

        let target = TargetInfo {
            adapter_id: LUID {
                high_part: raw_target.adapterId.HighPart,
                low_part: raw_target.adapterId.LowPart,
            },
            id: raw_target.id,
            output_technology: raw_target.outputTechnology.0,
            rotation: raw_target.rotation.0,
            scaling: raw_target.scaling.0,
            refresh_rate: RefreshRate {
                numerator: raw_target.refreshRate.Numerator,
                denominator: raw_target.refreshRate.Denominator,
            },
            scan_line_ordering: raw_target.scanLineOrdering.0,
            target_available: raw_target.targetAvailable.as_bool(),
            status_flags: raw_target.statusFlags,
        };

        Display { source, target }
    }
}
