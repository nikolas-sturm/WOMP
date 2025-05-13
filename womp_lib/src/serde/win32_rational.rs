use serde::{Deserialize, Deserializer, Serialize, Serializer};
use windows::Win32::Devices::Display::DISPLAYCONFIG_RATIONAL;

#[derive(Serialize, Deserialize)]
struct RationalDef {
    numerator: u32,
    denominator: u32,
}

pub fn serialize<S>(
    rational: &DISPLAYCONFIG_RATIONAL,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    RationalDef {
        numerator: rational.Numerator,
        denominator: rational.Denominator,
    }
    .serialize(serializer)
}

pub fn deserialize<'de, D>(deserializer: D) -> Result<DISPLAYCONFIG_RATIONAL, D::Error>
where
    D: Deserializer<'de>,
{
    let helper = RationalDef::deserialize(deserializer)?;
    Ok(DISPLAYCONFIG_RATIONAL {
        Numerator: helper.numerator,
        Denominator: helper.denominator,
    })
}