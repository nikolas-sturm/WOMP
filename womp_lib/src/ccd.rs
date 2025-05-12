use windows::Win32::{Devices::Display::*, Foundation::*};
use crate::types::Display;

pub struct CCDWrapper {
    flags: QUERY_DISPLAY_CONFIG_FLAGS,
    paths: Vec<DISPLAYCONFIG_PATH_INFO>,
    modes: Vec<DISPLAYCONFIG_MODE_INFO>,
}

impl CCDWrapper {
    pub fn new(active_only: bool) -> Self {
        let flags = if active_only {
            QDC_ONLY_ACTIVE_PATHS
        } else {
            QDC_ALL_PATHS
        };
        let paths = vec![];
        let modes = vec![];
        CCDWrapper {
            flags,
            paths,
            modes,
        }
    }

    fn get_paths_and_modes(&mut self) -> Result<String, String> {
        let max_retries = 3;
        let mut path_count: u32 = 0;
        let mut mode_count: u32 = 0;

        for attempt in 0..=max_retries {
            let raw_path_count = &mut path_count as *mut u32;
            let raw_mode_count = &mut mode_count as *mut u32;
    
            unsafe { 
                let res = GetDisplayConfigBufferSizes(
                    self.flags, 
                    raw_path_count, 
                    raw_mode_count
                );
                if res != ERROR_SUCCESS {
                    return Result::Err(format!("Unknown Error occured."))
                }
            }
    
            self.paths.resize_with(path_count as usize, Default::default);
            self.modes.resize_with(mode_count as usize, Default::default);
    
            let raw_paths = self.paths.as_mut_ptr();
            let raw_modes = self.modes.as_mut_ptr();
    
            unsafe { 
                let res = QueryDisplayConfig(
                    self.flags,
                    raw_path_count,
                    raw_paths,
                    raw_mode_count,
                    raw_modes,
                    None
                );
                if res != ERROR_SUCCESS {
                    return Result::Err(format!("Unknown Error occured."))
                } else if res == ERROR_INSUFFICIENT_BUFFER {
                    println!("Buffer mismatch! Trying again for attempt no. {attempt}/{max_retries}");
                    continue;
                }
            }
    
            self.paths.resize_with(path_count as usize, Default::default);
            self.modes.resize_with(mode_count as usize, Default::default);
        }
        return Result::Ok(format!("Successfully retrieved {path_count} Paths and {mode_count} Modes"));
    }

    pub fn get_displays(&mut self) -> Result<Vec<Display>, String> {
        let result = self.get_paths_and_modes();
        if let Err(_) = result {
            panic!("Cannot continue without paths and modes!");
        }

        let mut displays: Vec<Display> = vec![];

        for path in self.paths.clone() {
            let mut target_name: DISPLAYCONFIG_TARGET_DEVICE_NAME = Default::default();

            target_name.header.adapterId = path.targetInfo.adapterId;
            target_name.header.id = path.targetInfo.id;
            target_name.header.r#type = DISPLAYCONFIG_DEVICE_INFO_GET_TARGET_NAME;
            target_name.header.size = std::mem::size_of::<DISPLAYCONFIG_TARGET_DEVICE_NAME>() as u32;

            let mut raw_header = &mut target_name.header as *mut DISPLAYCONFIG_DEVICE_INFO_HEADER;

            let mut res;

            unsafe {
                let error = DisplayConfigGetDeviceInfo(raw_header);
                res = WIN32_ERROR(error.try_into().unwrap())
            }

            if res != ERROR_SUCCESS {
                eprintln!("{res:?}");
                panic!();
            }

            let mut adapter_name: DISPLAYCONFIG_ADAPTER_NAME = Default::default();

            adapter_name.header.adapterId = path.targetInfo.adapterId;
            adapter_name.header.r#type = DISPLAYCONFIG_DEVICE_INFO_GET_ADAPTER_NAME;
            adapter_name.header.size = std::mem::size_of::<DISPLAYCONFIG_ADAPTER_NAME>() as u32;

            raw_header = &mut adapter_name.header as *mut DISPLAYCONFIG_DEVICE_INFO_HEADER;

            unsafe {
                let error = DisplayConfigGetDeviceInfo(raw_header);
                res = WIN32_ERROR(error.try_into().unwrap())
            }

            if res != ERROR_SUCCESS {
                eprintln!("{res:?}");
                panic!();
            }

            displays.push(Display::from(path));
        }
        Result::Ok(displays)
    }
}
