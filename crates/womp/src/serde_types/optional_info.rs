use serde::{Deserialize, Serialize};

#[derive(Copy, Clone, Serialize, Deserialize)]
pub struct OptionalInfo {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dpiScale: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hdrEnabled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hdrSupported: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sdrWhiteLevel: Option<u32>,
}

impl OptionalInfo {
    pub fn is_empty(&self) -> bool {
        self.dpiScale.is_none()
            && self.hdrEnabled.is_none()
            && self.hdrSupported.is_none()
            && self.sdrWhiteLevel.is_none()
    }
}
