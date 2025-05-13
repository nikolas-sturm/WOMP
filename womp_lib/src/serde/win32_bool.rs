use serde::{Deserialize, Deserializer, Serializer};
use windows::core::BOOL;

pub fn serialize<S>(b: &BOOL, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    serializer.serialize_bool(b.as_bool())
}

pub fn deserialize<'de, D>(deserializer: D) -> Result<BOOL, D::Error>
where
    D: Deserializer<'de>,
{
    bool::deserialize(deserializer).map(BOOL::from)
}
