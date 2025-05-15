use serde::{Deserialize, Deserializer, Serializer};
use widestring::WideCString;

pub fn serialize<S, const N: usize>(wide_arr: &[u16; N], serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let serialized = WideCString::from_vec_truncate(wide_arr).to_string_lossy();

    serializer.serialize_str(&serialized)
}

pub fn deserialize<'de, D, const N: usize>(deserializer: D) -> Result<[u16; N], D::Error>
where
    D: Deserializer<'de>,
{
    let s: String = Deserialize::deserialize(deserializer)?;

    let widestring = WideCString::from_str(&s).map_err(serde::de::Error::custom)?;

    let u16_vec = widestring.into_vec_with_nul();

    let mut result = [0u16; N];
    let len = std::cmp::min(u16_vec.len(), N);
    result[..len].copy_from_slice(&u16_vec[..len]);

    Ok(result)
}
