use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Default)]
#[serde(default)]
pub struct Data {
    pub config: Config
}

#[derive(Serialize, Deserialize, Default)]
#[serde(default)]
pub struct Config {
    pub run: Run
}

#[derive(Serialize, Deserialize, Default)]
#[serde(default)]
pub struct Run {
    pub before: String,
    pub after: String
}