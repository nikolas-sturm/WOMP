use serde::{Deserialize, Deserializer, Serialize, Serializer};
use windows::Win32::Devices::Display::DISPLAYCONFIG_VIDEO_SIGNAL_INFO_0;

pub struct Win32VideoSignalInfoUnion;

impl Win32VideoSignalInfoUnion {
    pub fn serialize<S>(
        union_val: &DISPLAYCONFIG_VIDEO_SIGNAL_INFO_0,
        serializer: S,
    ) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        // Treat the union simply as a u32 videoStandard value
        // This avoids the data corruption issues with trying to determine variants
        let video_standard = unsafe { union_val.videoStandard };
        video_standard.serialize(serializer)
    }

    pub fn deserialize<'de, D>(
        deserializer: D,
    ) -> Result<DISPLAYCONFIG_VIDEO_SIGNAL_INFO_0, D::Error>
    where
        D: Deserializer<'de>,
    {
        let video_standard = u32::deserialize(deserializer)?;

        let mut result: DISPLAYCONFIG_VIDEO_SIGNAL_INFO_0 = unsafe { std::mem::zeroed() };
        result.videoStandard = video_standard;

        Ok(result)
    }
}
