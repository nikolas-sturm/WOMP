use serde::{Deserialize, Deserializer, Serialize, Serializer};
use windows::Win32::Foundation::POINTL;

#[derive(Serialize, Deserialize)]
struct PointLDef {
    x: i32,
    y: i32,
}

pub fn serialize<S>(point: &POINTL, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    PointLDef {
        x: point.x,
        y: point.y,
    }
    .serialize(serializer)
}

pub fn deserialize<'de, D>(deserializer: D) -> Result<POINTL, D::Error>
where
    D: Deserializer<'de>,
{
    let helper = PointLDef::deserialize(deserializer)?;
    Ok(POINTL {
        x: helper.x,
        y: helper.y,
    })
}
