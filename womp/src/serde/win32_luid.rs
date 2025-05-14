use serde::{Deserialize, Deserializer, Serialize, Serializer};
use windows::Win32::Foundation::LUID as Win32LUID;

#[derive(Serialize, Deserialize)]
struct LuidDef {
    lowPart: u32,
    highPart: i32,
}

pub fn serialize<S>(luid: &Win32LUID, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    LuidDef {
        lowPart: luid.LowPart,
        highPart: luid.HighPart,
    }
    .serialize(serializer)
}

pub fn deserialize<'de, D>(deserializer: D) -> Result<Win32LUID, D::Error>
where
    D: Deserializer<'de>,
{
    let helper = LuidDef::deserialize(deserializer)?;
    Ok(Win32LUID {
        LowPart: helper.lowPart,
        HighPart: helper.highPart,
    })
}
