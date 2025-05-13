use serde::{Deserialize, Deserializer, Serialize, Serializer};
use windows::Win32::Devices::Display::DISPLAYCONFIG_2DREGION;

#[derive(Serialize, Deserialize)]
struct RegionDef {
    cx: u32,
    cy: u32,
}

pub fn serialize<S>(
    region: &DISPLAYCONFIG_2DREGION,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    RegionDef {
        cx: region.cx,
        cy: region.cy,
    }
    .serialize(serializer)
}

pub fn deserialize<'de, D>(deserializer: D) -> Result<DISPLAYCONFIG_2DREGION, D::Error>
where
    D: Deserializer<'de>,
{
    let helper = RegionDef::deserialize(deserializer)?;
    Ok(DISPLAYCONFIG_2DREGION {
        cx: helper.cx,
        cy: helper.cy,
    })
}
