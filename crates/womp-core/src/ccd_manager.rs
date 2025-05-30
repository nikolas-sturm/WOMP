#![allow(non_camel_case_types)]
#![allow(non_snake_case)]

use crate::serde_types::{
    Display, DisplayLayout, GlobalInfo, WallpaperInfo, global_config::GlobalConfig,
    optional_info::OptionalInfo,
};
use itertools::Itertools;
use std::mem::size_of;
use windows::Win32::{
    Devices::Display::*, Foundation::*, Media::Audio::*, System::Com::*, System::Variant::VARIANT,
    UI::Shell::*, UI::WindowsAndMessaging::*,
};
use windows::core::{GUID, HRESULT, HSTRING, Interface, PCWSTR};

// DPI values observed from system settings
const DPI_VALS: [u32; 12] = [100, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500];

// Custom device info types (undocumented)
const DISPLAYCONFIG_DEVICE_INFO_GET_DPI_SCALE: i32 = -3;
const DISPLAYCONFIG_DEVICE_INFO_SET_DPI_SCALE: i32 = -4;
const DISPLAYCONFIG_DEVICE_INFO_GET_ADVANCED_COLOR_INFO: i32 = 9;
const DISPLAYCONFIG_DEVICE_INFO_SET_ADVANCED_COLOR_STATE: i32 = 10;
const DISPLAYCONFIG_DEVICE_INFO_GET_SDR_WHITE_LEVEL: i32 = 11;
const DISPLAYCONFIG_DEVICE_INFO_SET_SDR_WHITE_LEVEL: i32 = -18; // 0xFFFFFFEE in hex

// DPI scaling info structure
pub struct DpiScalingInfo {
    pub minimum: u32,
    pub maximum: u32,
    pub current: u32,
    pub recommended: u32,
}

// HDR/Advanced Color info structure
pub struct HdrInfo {
    pub advanced_color_supported: bool,
    pub advanced_color_enabled: bool,
    pub wide_color_enforced: bool,
    pub advanced_color_force_disabled: bool,
    pub color_encoding: u32,
    pub bits_per_color_channel: i32,
}

// Custom struct for getting DPI scale info
#[repr(C)]
struct DisplayConfigSourceDpiScaleGet {
    header: DISPLAYCONFIG_DEVICE_INFO_HEADER,
    min_scale_rel: i32,
    cur_scale_rel: i32,
    max_scale_rel: i32,
}

// Custom struct for setting DPI scale
#[repr(C)]
struct DisplayConfigSourceDpiScaleSet {
    header: DISPLAYCONFIG_DEVICE_INFO_HEADER,
    scale_rel: i32,
}

// Custom struct for getting advanced color info
#[repr(C)]
struct DisplayConfigGetAdvancedColorInfo {
    header: DISPLAYCONFIG_DEVICE_INFO_HEADER,
    value: u32,
    color_encoding: u32,
    bits_per_color_channel: i32,
}

// Custom struct for setting advanced color state
#[repr(C)]
struct DisplayConfigSetAdvancedColorState {
    header: DISPLAYCONFIG_DEVICE_INFO_HEADER,
    enable_advanced_color: u32,
}

// Custom struct for getting SDR white level
#[repr(C)]
struct DisplayConfigGetSdrWhiteLevel {
    header: DISPLAYCONFIG_DEVICE_INFO_HEADER,
    sdr_white_level: u32,
}

// Custom struct for setting SDR white level
#[repr(C)]
struct DisplayConfigSetSdrWhiteLevel {
    header: DISPLAYCONFIG_DEVICE_INFO_HEADER,
    sdr_white_level: u32,
    final_value: u8,
}

pub struct CCDWrapper {
    flags: QUERY_DISPLAY_CONFIG_FLAGS,
    paths: Vec<DISPLAYCONFIG_PATH_INFO>,
    modes: Vec<DISPLAYCONFIG_MODE_INFO>,
    _debug: bool,
}

// Define the UUIDs for the undocumented COM interfaces
pub const CLSID_POLICY_CONFIG_CLIENT: GUID =
    GUID::from_u128(0x870af99c_171d_4f9e_af0d_e63df40c2bc9);
pub const IID_IPOLICY_CONFIG: GUID = GUID::from_u128(0xf8679f50_850a_41cf_9c72_430f290290c8);

// Define the PolicyConfig interface
#[windows::core::interface("f8679f50-850a-41cf-9c72-430f290290c8")]
unsafe trait IPolicyConfig: windows::core::IUnknown {
    unsafe fn GetMixFormat(
        &self,
        pwstrdeviceid: PCWSTR,
        ppformat: *mut *mut WAVEFORMATEX,
    ) -> HRESULT;
    unsafe fn GetDeviceFormat(
        &self,
        pwstrdeviceid: PCWSTR,
        flow: i32,
        ppformat: *mut *mut WAVEFORMATEX,
    ) -> HRESULT;
    unsafe fn ResetDeviceFormat(&self, pwstrdeviceid: PCWSTR) -> HRESULT;
    unsafe fn SetDeviceFormat(
        &self,
        pwstrdeviceid: PCWSTR,
        pdesiredformat: *const WAVEFORMATEX,
        pclientformat: *const WAVEFORMATEX,
    ) -> HRESULT;
    unsafe fn GetProcessingPeriod(
        &self,
        pwstrdeviceid: PCWSTR,
        flow: i32,
        pdefaultperiod: *mut i64,
        pminimumperiod: *mut i64,
    ) -> HRESULT;
    unsafe fn SetProcessingPeriod(
        &self,
        pwstrdeviceid: PCWSTR,
        pdefaultperiod: *const i64,
    ) -> HRESULT;
    unsafe fn GetShareMode(&self, pwstrdeviceid: PCWSTR, psharemode: *mut i32) -> HRESULT;
    unsafe fn SetShareMode(&self, pwstrdeviceid: PCWSTR, psharemode: *const i32) -> HRESULT;
    unsafe fn GetPropertyValue(
        &self,
        pwstrdeviceid: PCWSTR,
        key: *const (),
        pv: *mut (),
    ) -> HRESULT;
    unsafe fn SetPropertyValue(
        &self,
        pwstrdeviceid: PCWSTR,
        key: *const (),
        pv: *const (),
    ) -> HRESULT;
    unsafe fn SetDefaultEndpoint(&self, pwstrdeviceid: PCWSTR, role: i32) -> HRESULT;
    unsafe fn SetEndpointVisibility(&self, pwstrdeviceid: PCWSTR, visible: i32) -> HRESULT;
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
        path: &DISPLAYCONFIG_PATH_INFO,
        global_config: &GlobalConfig,
    ) -> (
        DISPLAYCONFIG_TARGET_DEVICE_NAME,
        DISPLAYCONFIG_ADAPTER_NAME,
        OptionalInfo,
    ) {
        let target = &path.targetInfo;
        let source = &path.sourceInfo;

        let mut target_name: DISPLAYCONFIG_TARGET_DEVICE_NAME = Default::default();
        let mut adapter_name: DISPLAYCONFIG_ADAPTER_NAME = Default::default();

        target_name.header = DISPLAYCONFIG_DEVICE_INFO_HEADER {
            adapterId: target.adapterId,
            id: target.id,
            r#type: DISPLAYCONFIG_DEVICE_INFO_GET_TARGET_NAME,
            size: size_of::<DISPLAYCONFIG_TARGET_DEVICE_NAME>() as u32,
        };

        adapter_name.header = DISPLAYCONFIG_DEVICE_INFO_HEADER {
            adapterId: target.adapterId,
            id: target.id,
            r#type: DISPLAYCONFIG_DEVICE_INFO_GET_ADAPTER_NAME,
            size: size_of::<DISPLAYCONFIG_ADAPTER_NAME>() as u32,
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

        // Only get DPI info if it's enabled in config
        let dpi_scale = if global_config.save_dpi_scale {
            match self.get_display_dpi_info(source.adapterId, source.id) {
                Ok(dpi_info) => Some(dpi_info.current),
                Err(_) => None,
            }
        } else {
            None
        };

        // Only get HDR info if it's enabled in config
        let (hdr_supported, hdr_enabled) = if global_config.save_hdr_state {
            match self.get_display_hdr_info(target.adapterId, target.id) {
                Ok(hdr_info) => (
                    Some(hdr_info.advanced_color_supported),
                    Some(hdr_info.advanced_color_enabled),
                ),
                Err(_) => (None, None),
            }
        } else {
            (None, None)
        };

        // Only get SDR white level if HDR is enabled and the feature is enabled in config
        let sdr_white_level = if global_config.save_sdr_white_level && hdr_enabled == Some(true) {
            match self.get_display_sdr_white_level(target.adapterId, target.id) {
                Ok(level) => Some(level),
                Err(_) => None,
            }
        } else {
            None
        };

        let settings = OptionalInfo {
            dpiScale: dpi_scale,
            hdrSupported: hdr_supported,
            hdrEnabled: hdr_enabled,
            sdrWhiteLevel: sdr_white_level,
        };

        (target_name, adapter_name, settings)
    }

    pub fn get_display_layout(
        &mut self,
        global_config: &GlobalConfig,
    ) -> Result<DisplayLayout, String> {
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

            let (target_name, adapter_name, optional_info) =
                self.get_additional_info(&path, global_config);

            displays.push(Display::from(
                path,
                modes[0],
                modes[1],
                &target_name,
                &adapter_name,
                &optional_info,
            ))
        }

        let icon_size = if global_config.save_icon_size {
            match self.get_desktop_icon_size() {
                Ok((_, icon_size)) => Some(icon_size),
                Err(_) => None,
            }
        } else {
            None
        };

        let wallpaper_info = if global_config.save_wallpaper_info {
            match self.get_wallpaper_info() {
                Ok(wallpaper_info) => Some(wallpaper_info),
                Err(_) => None,
            }
        } else {
            None
        };

        let audio_output = if global_config.save_audio_output {
            match self.get_default_audio_output() {
                Ok(audio_output) => Some(audio_output),
                Err(_) => None,
            }
        } else {
            None
        };

        let global_info = GlobalInfo::from(icon_size, wallpaper_info, audio_output);
        let display_layout = DisplayLayout::from(displays, global_info);

        Result::Ok(display_layout)
    }

    fn adjust_adapter_ids(
        &self,
        source: &DisplayLayout,
        target: &mut DisplayLayout,
    ) -> Result<(), String> {
        for display in &mut target.displays {
            for s in &source.displays {
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

    pub fn apply_display_layout(
        &mut self,
        display_layout: &mut DisplayLayout,
        global_config: &GlobalConfig,
    ) -> Result<(), String> {
        let current_layout = match self.get_display_layout(global_config) {
            Ok(display_layout) => display_layout,
            Err(e) => panic!("Could not load current display config: {e}!"),
        };

        if let Err(e) = self.adjust_adapter_ids(&current_layout, display_layout) {
            panic!("Could not adjust adapterIds: {e}!");
        }

        let mut paths = vec![];
        let mut target_modes = vec![];
        let mut source_modes = vec![];
        let mut target_names = vec![];
        let mut adapter_names = vec![];

        for d in &display_layout.displays {
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

        if global_config.save_dpi_scale {
            for d in &display_layout.displays {
                self.set_display_dpi(
                    d.pathInfo.sourceInfo.adapterId,
                    d.pathInfo.sourceInfo.id,
                    d.optionalInfo.dpiScale.unwrap(),
                )?;
            }
        }

        if global_config.save_hdr_state {
            for d in &display_layout.displays {
                if let (Some(enabled), Some(supported)) =
                    (d.optionalInfo.hdrEnabled, d.optionalInfo.hdrSupported)
                {
                    if supported {
                        self.set_display_hdr(
                            d.pathInfo.targetInfo.adapterId,
                            d.pathInfo.targetInfo.id,
                            enabled,
                        )?;
                    }
                }
            }
        }

        if global_config.save_sdr_white_level {
            for d in &display_layout.displays {
                if let (Some(white_level), Some(hdr_enabled)) =
                    (d.optionalInfo.sdrWhiteLevel, d.optionalInfo.hdrEnabled)
                {
                    if hdr_enabled {
                        self.set_display_sdr_white_level(
                            d.pathInfo.targetInfo.adapterId,
                            d.pathInfo.targetInfo.id,
                            white_level,
                        )?;
                    }
                }
            }
        }

        if global_config.save_icon_size {
            self.set_desktop_icon_size(&display_layout.globalInfo.iconSize.unwrap())?;
        }

        if global_config.save_wallpaper_info {
            self.set_wallpaper_info(&display_layout.globalInfo.wallpaperInfo.as_ref().unwrap())?;
        }

        if global_config.save_audio_output {
            self.set_default_audio_output(
                &display_layout.globalInfo.audioOutput.as_ref().unwrap(),
            )?;
        }

        Ok(())
    }

    pub fn turn_off_all_displays(&mut self) -> Result<(), String> {
        unsafe {
            let res = SendMessageA(
                HWND_BROADCAST,
                WM_SYSCOMMAND,
                WPARAM(SC_MONITORPOWER as usize),
                LPARAM(2), // MONITOR_OFF
            );
            if res != LRESULT(0) {
                return Err(format!("Failed to turn off all displays: {res:?}"));
            }
        }
        Ok(())
    }

    fn get_display_dpi_info(
        &self,
        adapter_id: LUID,
        source_id: u32,
    ) -> Result<DpiScalingInfo, String> {
        let mut dpi_info = DpiScalingInfo {
            minimum: 100,
            maximum: 100,
            current: 100,
            recommended: 100,
        };

        let mut request_packet = DisplayConfigSourceDpiScaleGet {
            header: DISPLAYCONFIG_DEVICE_INFO_HEADER {
                adapterId: adapter_id,
                id: source_id,
                size: size_of::<DisplayConfigSourceDpiScaleGet>() as u32,
                r#type: DISPLAYCONFIG_DEVICE_INFO_TYPE(DISPLAYCONFIG_DEVICE_INFO_GET_DPI_SCALE),
            },
            min_scale_rel: 0,
            cur_scale_rel: 0,
            max_scale_rel: 0,
        };

        let header_ptr = &mut request_packet.header as *mut DISPLAYCONFIG_DEVICE_INFO_HEADER;

        let result = unsafe { DisplayConfigGetDeviceInfo(header_ptr) };

        if result != ERROR_SUCCESS.0 as i32 {
            return Err(format!(
                "Failed to get DPI info: {:?}",
                WIN32_ERROR(result.try_into().unwrap())
            ));
        }

        // Ensure current value is within bounds
        if request_packet.cur_scale_rel < request_packet.min_scale_rel {
            request_packet.cur_scale_rel = request_packet.min_scale_rel;
        } else if request_packet.cur_scale_rel > request_packet.max_scale_rel {
            request_packet.cur_scale_rel = request_packet.max_scale_rel;
        }

        // Calculate absolute index values safely
        let min_abs = (request_packet.min_scale_rel.abs()) as usize;

        // Check if all required indices fit within the DPI_VALS array
        // This avoids overflow by checking each component separately
        if min_abs < DPI_VALS.len()
            && request_packet.max_scale_rel >= 0
            && (request_packet.max_scale_rel as usize) < DPI_VALS.len()
            && min_abs + (request_packet.max_scale_rel as usize) < DPI_VALS.len()
        {
            // Safe to calculate indices - directly use the values as in the C++ code
            let curr_rel = request_packet.cur_scale_rel;
            // Handle negative cur_scale_rel properly
            let curr_idx = if curr_rel < 0 {
                // For negative values, we need to be careful not to underflow
                if min_abs >= curr_rel.unsigned_abs() as usize {
                    min_abs - curr_rel.unsigned_abs() as usize
                } else {
                    // If would underflow, clamp to 0
                    0
                }
            } else {
                min_abs + curr_rel as usize
            };

            let max_idx = min_abs + request_packet.max_scale_rel as usize;

            // Ensure all indices are in bounds
            if curr_idx < DPI_VALS.len() && max_idx < DPI_VALS.len() {
                dpi_info.current = DPI_VALS[curr_idx];
                dpi_info.recommended = DPI_VALS[min_abs];
                dpi_info.maximum = DPI_VALS[max_idx];
                dpi_info.minimum = 100; // Always 100

                Ok(dpi_info)
            } else {
                Err("Calculated DPI indices out of bounds".to_string())
            }
        } else {
            Err("DPI values array is outdated or incompatible".to_string())
        }
    }

    pub fn set_display_dpi(
        &self,
        adapter_id: LUID,
        source_id: u32,
        dpi_percent: u32,
    ) -> Result<(), String> {
        // First get current DPI info to determine relative values
        let dpi_info = self.get_display_dpi_info(adapter_id, source_id)?;

        // Skip if already at the requested value
        if dpi_percent == dpi_info.current {
            return Ok(());
        }

        // Find indices in the DPI values array
        let mut target_idx = -1;
        let mut recommended_idx = -1;

        for (i, &val) in DPI_VALS.iter().enumerate() {
            if val == dpi_percent {
                target_idx = i as i32;
            }
            if val == dpi_info.recommended {
                recommended_idx = i as i32;
            }

            if target_idx != -1 && recommended_idx != -1 {
                break;
            }
        }

        if target_idx == -1 || recommended_idx == -1 {
            return Err(format!(
                "Could not find DPI value {} or recommended value {} in supported values",
                dpi_percent, dpi_info.recommended
            ));
        }

        // Calculate relative DPI value
        let dpi_relative_val = target_idx - recommended_idx;

        // Create set packet
        let mut set_packet = DisplayConfigSourceDpiScaleSet {
            header: DISPLAYCONFIG_DEVICE_INFO_HEADER {
                adapterId: adapter_id,
                id: source_id,
                size: size_of::<DisplayConfigSourceDpiScaleSet>() as u32,
                r#type: DISPLAYCONFIG_DEVICE_INFO_TYPE(DISPLAYCONFIG_DEVICE_INFO_SET_DPI_SCALE),
            },
            scale_rel: dpi_relative_val,
        };

        let header_ptr = &mut set_packet.header as *mut DISPLAYCONFIG_DEVICE_INFO_HEADER;

        let result = unsafe { DisplayConfigSetDeviceInfo(header_ptr) };

        if result != ERROR_SUCCESS.0 as i32 {
            return Err(format!(
                "Failed to set DPI value: {:?}",
                WIN32_ERROR(result.try_into().unwrap())
            ));
        }

        Ok(())
    }

    pub fn get_desktop_icon_size(&self) -> Result<(FOLDERVIEWMODE, i32), String> {
        let result = self.find_desktop_folder_view();
        match result {
            Ok(folder_view) => {
                let mut view_mode = FOLDERVIEWMODE::default();
                let mut icon_size = 0i32;

                unsafe {
                    let hr = folder_view.GetViewModeAndIconSize(&mut view_mode, &mut icon_size);
                    if hr.is_err() {
                        return Err(format!("GetViewModeAndIconSize failed: {:?}", hr));
                    }
                }

                Ok((view_mode, icon_size))
            }
            Err(e) => Err(e),
        }
    }

    pub fn set_desktop_icon_size(&self, icon_size: &i32) -> Result<(), String> {
        // Get current view mode and icon size
        let (view_mode, current_size) = self.get_desktop_icon_size()?;

        // Skip if already at requested size
        if current_size == *icon_size {
            return Ok(());
        }

        let result = self.find_desktop_folder_view();
        match result {
            Ok(folder_view) => {
                unsafe {
                    let hr = folder_view.SetViewModeAndIconSize(view_mode, *icon_size);
                    if hr.is_err() {
                        return Err(format!("SetViewModeAndIconSize failed: {:?}", hr));
                    }
                }
                Ok(())
            }
            Err(e) => Err(e),
        }
    }

    // Helper function to find the desktop folder view and query for the requested interface
    fn find_desktop_folder_view(&self) -> Result<IFolderView2, String> {
        unsafe {
            // Initialize COM if not already initialized
            let hr = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
            if hr.is_err() && hr != CO_E_ALREADYINITIALIZED {
                return Err(format!("Failed to initialize COM: {:?}", hr));
            }

            // Create IShellWindows instance
            let shell_windows: IShellWindows =
                match CoCreateInstance(&ShellWindows, None, CLSCTX_ALL) {
                    Ok(windows) => windows,
                    Err(e) => {
                        return Err(format!("Failed to create IShellWindows instance: {:?}", e));
                    }
                };

            // Find desktop window
            let loc = VARIANT::from(CSIDL_DESKTOP as i32);
            let empty = VARIANT::default();
            let mut hwnd = 0i32;

            let dispatch = match shell_windows.FindWindowSW(
                &loc,
                &empty,
                SWC_DESKTOP,
                &mut hwnd,
                SWFO_NEEDDISPATCH,
            ) {
                Ok(dispatch) => dispatch,
                Err(e) => return Err(format!("Failed to find desktop window: {:?}", e)),
            };

            // Query for IServiceProvider
            let service_provider: IServiceProvider = match dispatch.cast() {
                Ok(provider) => provider,
                Err(e) => return Err(format!("Failed to get IServiceProvider interface: {:?}", e)),
            };

            // Get shell browser
            let browser: IShellBrowser = match service_provider.QueryService(&SID_STopLevelBrowser)
            {
                Ok(browser) => browser,
                Err(e) => return Err(format!("Failed to get IShellBrowser: {:?}", e)),
            };

            // Get shell view
            let view = match browser.QueryActiveShellView() {
                Ok(view) => view,
                Err(e) => return Err(format!("Failed to get IShellView: {:?}", e)),
            };

            // Query for requested interface
            match view.cast::<IFolderView2>() {
                Ok(folder_view) => Ok(folder_view),
                Err(e) => Err(format!("Failed to query for requested interface: {:?}", e)),
            }
        }
    }

    fn get_display_hdr_info(&self, adapter_id: LUID, source_id: u32) -> Result<HdrInfo, String> {
        let mut color_info = DisplayConfigGetAdvancedColorInfo {
            header: DISPLAYCONFIG_DEVICE_INFO_HEADER {
                adapterId: adapter_id,
                id: source_id,
                size: size_of::<DisplayConfigGetAdvancedColorInfo>() as u32,
                r#type: DISPLAYCONFIG_DEVICE_INFO_TYPE(
                    DISPLAYCONFIG_DEVICE_INFO_GET_ADVANCED_COLOR_INFO,
                ),
            },
            value: 0,
            color_encoding: 0,
            bits_per_color_channel: 0,
        };

        let header_ptr = &mut color_info.header as *mut DISPLAYCONFIG_DEVICE_INFO_HEADER;

        let result = unsafe { DisplayConfigGetDeviceInfo(header_ptr) };

        if result != ERROR_SUCCESS.0 as i32 {
            return Err(format!(
                "Failed to get HDR info: {:?}",
                WIN32_ERROR(result.try_into().unwrap())
            ));
        }

        // Extract boolean flags from the value field
        let advanced_color_supported = (color_info.value & 0x1) == 0x1;
        let advanced_color_enabled = (color_info.value & 0x2) == 0x2;
        let wide_color_enforced = (color_info.value & 0x4) == 0x4;
        let advanced_color_force_disabled = (color_info.value & 0x8) == 0x8;

        Ok(HdrInfo {
            advanced_color_supported,
            advanced_color_enabled,
            wide_color_enforced,
            advanced_color_force_disabled,
            color_encoding: color_info.color_encoding,
            bits_per_color_channel: color_info.bits_per_color_channel,
        })
    }

    pub fn get_display_sdr_white_level(
        &self,
        adapter_id: LUID,
        source_id: u32,
    ) -> Result<u32, String> {
        // First check if HDR is supported and enabled
        let hdr_info = self.get_display_hdr_info(adapter_id, source_id)?;

        if !hdr_info.advanced_color_supported || !hdr_info.advanced_color_enabled {
            return Err("HDR is not supported or not enabled on this display".to_string());
        }

        let mut white_level_info = DisplayConfigGetSdrWhiteLevel {
            header: DISPLAYCONFIG_DEVICE_INFO_HEADER {
                adapterId: adapter_id,
                id: source_id,
                size: size_of::<DisplayConfigGetSdrWhiteLevel>() as u32,
                r#type: DISPLAYCONFIG_DEVICE_INFO_TYPE(
                    DISPLAYCONFIG_DEVICE_INFO_GET_SDR_WHITE_LEVEL,
                ),
            },
            sdr_white_level: 0,
        };

        let header_ptr = &mut white_level_info.header as *mut DISPLAYCONFIG_DEVICE_INFO_HEADER;

        let result = unsafe { DisplayConfigGetDeviceInfo(header_ptr) };

        if result != ERROR_SUCCESS.0 as i32 {
            return Err(format!(
                "Failed to get SDR white level: {:?}",
                WIN32_ERROR(result.try_into().unwrap())
            ));
        }

        // Convert from internal value to nits (same formula as in the C example)
        let nits = white_level_info.sdr_white_level * 80 / 1000;

        Ok(nits)
    }

    pub fn set_display_hdr(
        &self,
        adapter_id: LUID,
        source_id: u32,
        enable: bool,
    ) -> Result<(), String> {
        // First check if HDR is supported and if it's already in the desired state
        let hdr_info = self.get_display_hdr_info(adapter_id, source_id)?;

        // If HDR is not supported, return an error
        if !hdr_info.advanced_color_supported {
            return Err("HDR is not supported on this display".to_string());
        }

        // If HDR is already in the desired state, we don't need to do anything
        if hdr_info.advanced_color_enabled == enable {
            return Ok(());
        }

        // Create the set packet
        let mut set_packet = DisplayConfigSetAdvancedColorState {
            header: DISPLAYCONFIG_DEVICE_INFO_HEADER {
                adapterId: adapter_id,
                id: source_id,
                size: size_of::<DisplayConfigSetAdvancedColorState>() as u32,
                r#type: DISPLAYCONFIG_DEVICE_INFO_TYPE(
                    DISPLAYCONFIG_DEVICE_INFO_SET_ADVANCED_COLOR_STATE,
                ),
            },
            enable_advanced_color: if enable { 1 } else { 0 },
        };

        let header_ptr = &mut set_packet.header as *mut DISPLAYCONFIG_DEVICE_INFO_HEADER;

        let result = unsafe { DisplayConfigSetDeviceInfo(header_ptr) };

        if result != ERROR_SUCCESS.0 as i32 {
            return Err(format!(
                "Failed to set HDR state: {:?}",
                WIN32_ERROR(result.try_into().unwrap())
            ));
        }

        Ok(())
    }

    pub fn set_display_sdr_white_level(
        &self,
        adapter_id: LUID,
        source_id: u32,
        nits: u32,
    ) -> Result<(), String> {
        // Check if HDR is supported and enabled
        let hdr_info = self.get_display_hdr_info(adapter_id, source_id)?;

        if !hdr_info.advanced_color_supported || !hdr_info.advanced_color_enabled {
            return Err("HDR is not supported or not enabled on this display".to_string());
        }

        // Validate nits range (same as in C example)
        if nits < 80 || nits > 480 {
            return Err(format!(
                "Invalid nits value {}. Value must be between 80 and 480.",
                nits
            ));
        }

        // Round up to multiple of 4 to match SDR brightness slider increments
        let nits = if nits % 4 != 0 {
            nits + (4 - (nits % 4))
        } else {
            nits
        };

        // Convert from nits to internal value (same formula as in the C example)
        let internal_value = nits * 1000 / 80;

        let mut set_packet = DisplayConfigSetSdrWhiteLevel {
            header: DISPLAYCONFIG_DEVICE_INFO_HEADER {
                adapterId: adapter_id,
                id: source_id,
                size: size_of::<DisplayConfigSetSdrWhiteLevel>() as u32,
                r#type: DISPLAYCONFIG_DEVICE_INFO_TYPE(
                    DISPLAYCONFIG_DEVICE_INFO_SET_SDR_WHITE_LEVEL,
                ),
            },
            sdr_white_level: internal_value,
            final_value: 1,
        };

        let header_ptr = &mut set_packet.header as *mut DISPLAYCONFIG_DEVICE_INFO_HEADER;

        let result = unsafe { DisplayConfigSetDeviceInfo(header_ptr) };

        if result != ERROR_SUCCESS.0 as i32 {
            return Err(format!(
                "Failed to set SDR white level: {:?}",
                WIN32_ERROR(result.try_into().unwrap())
            ));
        }

        Ok(())
    }

    pub fn get_wallpaper_info(&self) -> Result<WallpaperInfo, String> {
        unsafe {
            // Initialize COM
            let hr = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
            if hr.is_err() && hr != CO_E_ALREADYINITIALIZED {
                return Err(format!("Failed to initialize COM: {:?}", hr));
            }

            // Create IDesktopWallpaper instance
            let desktop_wallpaper: IDesktopWallpaper =
                match CoCreateInstance(&DesktopWallpaper, None, CLSCTX_LOCAL_SERVER) {
                    Ok(wallpaper) => wallpaper,
                    Err(e) => {
                        return Err(format!(
                            "Failed to create IDesktopWallpaper instance: {:?}",
                            e
                        ));
                    }
                };

            // Get current wallpaper for the primary monitor (NULL)
            let wallpaper_pwstr = match desktop_wallpaper.GetWallpaper(PCWSTR::null()) {
                Ok(path) => path,
                Err(e) => {
                    return Err(format!("Failed to get wallpaper path: {:?}", e));
                }
            };

            // Convert PWSTR to String
            let wallpaper_path_wide = wallpaper_pwstr.as_wide();
            let wallpaper_path = match String::from_utf16(wallpaper_path_wide) {
                Ok(s) => s,
                Err(_) => {
                    return Err("Failed to convert wallpaper path to string".to_string());
                }
            };

            // Get current wallpaper position
            let position = match desktop_wallpaper.GetPosition() {
                Ok(pos) => pos,
                Err(e) => {
                    return Err(format!("Failed to get wallpaper position: {:?}", e));
                }
            };

            // Convert position to string
            let position_str = match position {
                DWPOS_CENTER => "center".to_string(),
                DWPOS_TILE => "tile".to_string(),
                DWPOS_STRETCH => "stretch".to_string(),
                DWPOS_FIT => "fit".to_string(),
                DWPOS_FILL => "fill".to_string(),
                DWPOS_SPAN => "span".to_string(),
                _ => "unknown".to_string(),
            };

            // Free COM resources
            CoFreeUnusedLibraries();

            Ok(WallpaperInfo {
                wallpaperPath: wallpaper_path,
                wallpaperPosition: position_str,
            })
        }
    }

    pub fn set_wallpaper_info(&self, wallpaper_info: &WallpaperInfo) -> Result<(), String> {
        unsafe {
            // Initialize COM
            let hr = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
            if hr.is_err() && hr != CO_E_ALREADYINITIALIZED {
                return Err(format!("Failed to initialize COM: {:?}", hr));
            }

            // Create IDesktopWallpaper instance
            let desktop_wallpaper: IDesktopWallpaper =
                match CoCreateInstance(&DesktopWallpaper, None, CLSCTX_LOCAL_SERVER) {
                    Ok(wallpaper) => wallpaper,
                    Err(e) => {
                        return Err(format!(
                            "Failed to create IDesktopWallpaper instance: {:?}",
                            e
                        ));
                    }
                };

            // Convert path to HSTRING
            let wallpaper_path = HSTRING::from(wallpaper_info.wallpaperPath.clone());

            // Set wallpaper for all monitors (NULL)
            if let Err(e) = desktop_wallpaper.SetWallpaper(PCWSTR::null(), &wallpaper_path) {
                return Err(format!("Failed to set wallpaper: {:?}", e));
            }

            // Convert position string to DESKTOP_WALLPAPER_POSITION
            let position_val = match wallpaper_info.wallpaperPosition.to_lowercase().as_str() {
                "center" => DWPOS_CENTER,
                "tile" => DWPOS_TILE,
                "stretch" => DWPOS_STRETCH,
                "fit" => DWPOS_FIT,
                "fill" => DWPOS_FILL,
                "span" => DWPOS_SPAN,
                _ => {
                    return Err(format!(
                        "Invalid position value: {}. Must be one of: center, tile, stretch, fit, fill, span",
                        wallpaper_info.wallpaperPosition
                    ));
                }
            };

            // Set position
            if let Err(e) = desktop_wallpaper.SetPosition(position_val) {
                return Err(format!("Failed to set wallpaper position: {:?}", e));
            }

            // Free COM resources
            CoFreeUnusedLibraries();

            Ok(())
        }
    }

    pub fn get_default_audio_output(&self) -> Result<String, String> {
        unsafe {
            // Initialize COM if not already initialized
            let hr = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
            if hr.is_err() && hr != CO_E_ALREADYINITIALIZED {
                return Err(format!("Failed to initialize COM: {:?}", hr));
            }

            // Create device enumerator
            let device_enumerator: IMMDeviceEnumerator =
                match CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL) {
                    Ok(enumerator) => enumerator,
                    Err(e) => {
                        return Err(format!("Failed to create IMMDeviceEnumerator: {:?}", e));
                    }
                };

            // Get default audio endpoint
            let device = match device_enumerator.GetDefaultAudioEndpoint(eRender, eConsole) {
                Ok(device) => device,
                Err(e) => {
                    return Err(format!("Failed to get default audio endpoint: {:?}", e));
                }
            };

            // Get device ID
            let id_str = match device.GetId() {
                Ok(id) => {
                    let wide_str = id.as_wide();
                    String::from_utf16_lossy(wide_str)
                }
                Err(e) => {
                    return Err(format!("Failed to get device ID: {:?}", e));
                }
            };

            // We'd like to get the device name too, but since the property store methods aren't
            // directly available, we'll just return the ID for now
            // In a full implementation, you would get the friendly name from the property store

            // Clean up COM resources
            CoFreeUnusedLibraries();

            Ok(id_str)
        }
    }

    pub fn set_default_audio_output(&self, device_id: &str) -> Result<(), String> {
        unsafe {
            // Initialize COM if not already initialized
            let hr = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
            if hr.is_err() && hr != CO_E_ALREADYINITIALIZED {
                return Err(format!("Failed to initialize COM: {:?}", hr));
            }

            // Create PolicyConfig instance
            let policy_config: IPolicyConfig =
                match CoCreateInstance(&CLSID_POLICY_CONFIG_CLIENT, None, CLSCTX_ALL) {
                    Ok(config) => config,
                    Err(e) => {
                        return Err(format!("Failed to create IPolicyConfig: {:?}", e));
                    }
                };

            // Convert device ID to HSTRING
            let id_hstring = HSTRING::from(device_id);

            // Set as default endpoint for all roles (eConsole = 0, eMultimedia = 1, eCommunications = 2)
            for role in [0, 1, 2] {
                let hr =
                    policy_config.SetDefaultEndpoint(PCWSTR::from_raw(id_hstring.as_ptr()), role);
                if hr.is_err() {
                    return Err(format!(
                        "Failed to set default endpoint for role {}: {:?}",
                        role, hr
                    ));
                }
            }

            // Clean up COM resources
            CoFreeUnusedLibraries();

            Ok(())
        }
    }
}
