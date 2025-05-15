use std::sync::OnceLock;

static DEBUG_ENABLED: OnceLock<bool> = OnceLock::new();

pub fn init_debug_flag(value: bool) {
    DEBUG_ENABLED
        .set(value)
        .expect("Debug flag already initialized");
}

pub fn is_debug() -> bool {
    *DEBUG_ENABLED
        .get()
        .expect("Debug flag accessed before initialization")
}
