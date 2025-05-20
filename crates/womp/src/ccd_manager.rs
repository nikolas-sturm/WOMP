use crate::serde_types::Display;
use itertools::Itertools;
use windows::Win32::{Devices::Display::*, Foundation::*};

pub struct CCDWrapper {
    flags: QUERY_DISPLAY_CONFIG_FLAGS,
    paths: Vec<DISPLAYCONFIG_PATH_INFO>,
    modes: Vec<DISPLAYCONFIG_MODE_INFO>,
    _debug: bool,
}

impl CCDWrapper {
    pub fn new(active_only: bool, debug: bool) -> Self {
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
            _debug: debug,
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
                let res = GetDisplayConfigBufferSizes(self.flags, raw_path_count, raw_mode_count);
                if res != ERROR_SUCCESS {
                    return Result::Err(format!("Unknown Error occured."));
                }
            }

            self.paths
                .resize_with(path_count as usize, Default::default);
            self.modes
                .resize_with(mode_count as usize, Default::default);

            let raw_paths = self.paths.as_mut_ptr();
            let raw_modes = self.modes.as_mut_ptr();

            unsafe {
                let res = QueryDisplayConfig(
                    self.flags,
                    raw_path_count,
                    raw_paths,
                    raw_mode_count,
                    raw_modes,
                    None,
                );
                if res != ERROR_SUCCESS {
                    return Result::Err(format!("Unknown Error occured."));
                } else if res == ERROR_INSUFFICIENT_BUFFER {
                    println!(
                        "Buffer mismatch! Trying again for attempt no. {attempt}/{max_retries}"
                    );
                    continue;
                }
            }

            self.paths
                .resize_with(path_count as usize, Default::default);
            self.modes
                .resize_with(mode_count as usize, Default::default);
        }

        return Result::Ok(format!(
            "Successfully retrieved {path_count} Paths and {mode_count} Modes"
        ));
    }

    fn get_modes(&self, path: &DISPLAYCONFIG_PATH_INFO) -> [Option<&DISPLAYCONFIG_MODE_INFO>; 2] {
        let target_id = path.targetInfo.id;
        let target_adapter_id = path.targetInfo.adapterId;
        let source_id = path.sourceInfo.id;
        let source_adapter_id = path.sourceInfo.adapterId;

        let mut target_mode_opt: Option<&DISPLAYCONFIG_MODE_INFO> = None;
        let mut source_mode_opt: Option<&DISPLAYCONFIG_MODE_INFO> = None;

        for mode in &self.modes {
            if mode.adapterId == target_adapter_id && mode.id == target_id {
                target_mode_opt = Some(mode);
            }
            if mode.adapterId == source_adapter_id && mode.id == source_id {
                source_mode_opt = Some(mode);
            }

            if target_mode_opt.is_some() && source_mode_opt.is_some() {
                break;
            }
        }

        return [target_mode_opt, source_mode_opt];
    }

    fn get_additional_info(
        &self,
        target: &DISPLAYCONFIG_PATH_TARGET_INFO,
    ) -> (DISPLAYCONFIG_TARGET_DEVICE_NAME, DISPLAYCONFIG_ADAPTER_NAME) {
        let mut target_name: DISPLAYCONFIG_TARGET_DEVICE_NAME = Default::default();
        let mut adapter_name: DISPLAYCONFIG_ADAPTER_NAME = Default::default();

        target_name.header = DISPLAYCONFIG_DEVICE_INFO_HEADER {
            adapterId: target.adapterId,
            id: target.id,
            r#type: DISPLAYCONFIG_DEVICE_INFO_GET_TARGET_NAME,
            size: std::mem::size_of::<DISPLAYCONFIG_TARGET_DEVICE_NAME>() as u32,
        };

        adapter_name.header = DISPLAYCONFIG_DEVICE_INFO_HEADER {
            adapterId: target.adapterId,
            id: target.id,
            r#type: DISPLAYCONFIG_DEVICE_INFO_GET_ADAPTER_NAME,
            size: std::mem::size_of::<DISPLAYCONFIG_ADAPTER_NAME>() as u32,
        };

        let raw_target_header = &mut target_name.header as *mut DISPLAYCONFIG_DEVICE_INFO_HEADER;
        let raw_adapter_header = &mut adapter_name.header as *mut DISPLAYCONFIG_DEVICE_INFO_HEADER;

        unsafe {
            let e = DisplayConfigGetDeviceInfo(raw_target_header);
            let res = WIN32_ERROR(e.try_into().unwrap());
            if res != ERROR_SUCCESS {
                eprintln!("{res:?}");
                panic!();
            }

            let e = DisplayConfigGetDeviceInfo(raw_adapter_header);
            let res = WIN32_ERROR(e.try_into().unwrap());
            if res != ERROR_SUCCESS {
                eprintln!("{res:?}");
                panic!();
            }
        }

        (target_name, adapter_name)
    }

    pub fn get_displays(&mut self) -> Result<Vec<Display>, String> {
        let result = self.get_paths_and_modes();
        if let Err(_) = result {
            panic!("Cannot continue without paths and modes!");
        }

        let mut displays: Vec<Display> = vec![];

        for path in &self.paths {
            let modes: [&DISPLAYCONFIG_MODE_INFO; 2];

            if let [Some(target_mode), Some(source_mode)] = self.get_modes(path) {
                modes = [target_mode, source_mode];
            } else {
                continue;
            }

            let (target_name, adapter_name) = self.get_additional_info(&path.targetInfo);

            displays.push(Display::from(
                path,
                modes[0],
                modes[1],
                &target_name,
                &adapter_name,
            ))
        }

        Result::Ok(displays)
    }

    fn adjust_adapter_ids(
        &self,
        source: &Vec<Display>,
        target: &mut Vec<Display>,
    ) -> Result<(), String> {
        for display in target {
            for s in source {
                if s.pathInfo.targetInfo.id == display.pathInfo.targetInfo.id {
                    let new_id = s.pathInfo.targetInfo.adapterId;

                    display.pathInfo.sourceInfo.adapterId = new_id;
                    display.pathInfo.targetInfo.adapterId = new_id;
                    display.modeInfo.sourceModeInfo.adapterId = new_id;
                    display.modeInfo.targetModeInfo.adapterId = new_id;
                    display.additionalInfo.adapter.header.adapterId = new_id;
                    display.additionalInfo.target.header.adapterId = new_id;
                }
            }
        }
        Ok(())
    }

    pub fn apply_display_layout(&mut self, display_layout: &mut Vec<Display>) -> Result<(), String> {
        let current_config = match self.get_displays() {
            Ok(displays) => displays,
            Err(e) => panic!("Could not load current display config: {e}!"),
        };

        if let Err(e) = self.adjust_adapter_ids(&current_config, display_layout) {
            panic!("Could not adjust adapterIds: {e}!");
        }

        let mut paths = vec![];
        let mut target_modes = vec![];
        let mut source_modes = vec![];
        let mut target_names = vec![];
        let mut adapter_names = vec![];

        for d in display_layout {
            let (path_info, target_mode_info, source_mode_info, target_name, adapter_name) =
                d.to_windows_types();
            paths.push(path_info);
            target_modes.push(target_mode_info);
            source_modes.push(source_mode_info);
            target_names.push(target_name);
            adapter_names.push(adapter_name);
        }

        let modes: Vec<DISPLAYCONFIG_MODE_INFO> = target_modes
            .into_iter()
            .interleave(source_modes.into_iter())
            .collect();

        let mut flags = SDC_APPLY
            | SDC_USE_SUPPLIED_DISPLAY_CONFIG
            | SDC_SAVE_TO_DATABASE
            | SDC_NO_OPTIMIZATION;

        let patharray = Some(paths.as_slice());
        let modeinfoarray = Some(modes.as_slice());

        let mut res: WIN32_ERROR;

        unsafe {
            let e = SetDisplayConfig(
                patharray,
                modeinfoarray,
                SDC_USE_SUPPLIED_DISPLAY_CONFIG | SDC_VALIDATE,
            );
            res = WIN32_ERROR(e.try_into().unwrap());
        }

        if res != ERROR_SUCCESS {
            return Err(format!("Input arrays are invalid: {res:?}"));
        }

        unsafe {
            let e = SetDisplayConfig(patharray, modeinfoarray, flags);
            res = WIN32_ERROR(e.try_into().unwrap());
        }

        if res != ERROR_SUCCESS {
            eprintln!("Failed to apply, will try again with SDC_ALLOW_CHANGES: {res:?}");

            flags |= SDC_ALLOW_CHANGES;

            unsafe {
                let e = SetDisplayConfig(patharray, modeinfoarray, flags);
                res = WIN32_ERROR(e.try_into().unwrap());
            }
        }

        if res != ERROR_SUCCESS {
            return Err(format!("Failed to apply using SDC_ALLOW_CHANGES: {res:?}"));
        }

        Ok(())
    }
}
