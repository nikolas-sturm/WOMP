use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default)]
#[serde(default)]
pub struct Profile {
    pub config: Config,
}

#[derive(Serialize, Deserialize, Default)]
#[serde(default)]
pub struct Config {
    pub name: String,
    pub description: String,
    pub run: Run,
}

#[derive(Serialize, Deserialize, Default)]
#[serde(default)]
pub struct Run {
    pub before: String,
    pub after: String,
}
