#[macro_export]
macro_rules! define_tuple_struct_i32_serde_helper {
    ($mod_name:ident, $win_type:ty) => {
        pub mod $mod_name {
            use serde::{Deserialize, Deserializer, Serializer};
            use $win_type as LocalWinType;
            pub fn serialize<S>(val: &$win_type, serializer: S) -> Result<S::Ok, S::Error>
            where
                S: Serializer,
            {
                serializer.serialize_i32(val.0)
            }
            pub fn deserialize<'de, D>(deserializer: D) -> Result<$win_type, D::Error>
            where
                D: Deserializer<'de>,
            {
                let value_i32 = i32::deserialize(deserializer)?;
                Ok(LocalWinType(value_i32))
            }
        }
    };
}

define_tuple_struct_i32_serde_helper!(
    win32_output,
    windows::Win32::Devices::Display::DISPLAYCONFIG_VIDEO_OUTPUT_TECHNOLOGY
);
define_tuple_struct_i32_serde_helper!(
    win32_rotation,
    windows::Win32::Devices::Display::DISPLAYCONFIG_ROTATION
);
define_tuple_struct_i32_serde_helper!(
    win32_scaling,
    windows::Win32::Devices::Display::DISPLAYCONFIG_SCALING
);
define_tuple_struct_i32_serde_helper!(
    win32_scanline,
    windows::Win32::Devices::Display::DISPLAYCONFIG_SCANLINE_ORDERING
);
define_tuple_struct_i32_serde_helper!(
    win32_mode_info_type,
    windows::Win32::Devices::Display::DISPLAYCONFIG_MODE_INFO_TYPE
);
define_tuple_struct_i32_serde_helper!(
    win32_pixel_format,
    windows::Win32::Devices::Display::DISPLAYCONFIG_PIXELFORMAT
);
define_tuple_struct_i32_serde_helper!(
    win32_device_info_type,
    windows::Win32::Devices::Display::DISPLAYCONFIG_DEVICE_INFO_TYPE
);
