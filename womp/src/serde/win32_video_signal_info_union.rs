use serde::{Deserialize, Deserializer, Serialize, Serializer};
use windows::Win32::Devices::Display::DISPLAYCONFIG_VIDEO_SIGNAL_INFO_0;
use windows::Win32::Devices::Display::DISPLAYCONFIG_VIDEO_SIGNAL_INFO_0_0;

#[derive(Serialize, Deserialize)]
pub enum VideoSignalInfoUnionRepr {
    AdditionalSignalInfo { bitfield: u32 },
    VideoStandard(u32),
}

pub struct Win32VideoSignalInfoUnion;

impl Win32VideoSignalInfoUnion {
    pub fn serialize<S>(
        union_val: &DISPLAYCONFIG_VIDEO_SIGNAL_INFO_0,
        serializer: S,
    ) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        // We need to determine which field to use
        // For simplicity, we'll use videoStandard if it's non-zero, otherwise AdditionalSignalInfo
        let repr = unsafe {
            let video_standard = union_val.videoStandard;
            if video_standard != 0 {
                VideoSignalInfoUnionRepr::VideoStandard(video_standard)
            } else {
                VideoSignalInfoUnionRepr::AdditionalSignalInfo {
                    bitfield: union_val.AdditionalSignalInfo._bitfield,
                }
            }
        };

        repr.serialize(serializer)
    }

    pub fn deserialize<'de, D>(
        deserializer: D,
    ) -> Result<DISPLAYCONFIG_VIDEO_SIGNAL_INFO_0, D::Error>
    where
        D: Deserializer<'de>,
    {
        let repr = VideoSignalInfoUnionRepr::deserialize(deserializer)?;

        let mut result: DISPLAYCONFIG_VIDEO_SIGNAL_INFO_0 = unsafe { std::mem::zeroed() };

        match repr {
            VideoSignalInfoUnionRepr::AdditionalSignalInfo { bitfield } => {
                result.AdditionalSignalInfo = DISPLAYCONFIG_VIDEO_SIGNAL_INFO_0_0 {
                    _bitfield: bitfield,
                };
            },
            VideoSignalInfoUnionRepr::VideoStandard(val) => {
                result.videoStandard = val;
            },
        }

        Ok(result)
    }
}
