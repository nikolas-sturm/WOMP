use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct Config {
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub name: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub description: String,
    #[serde(default, skip_serializing_if = "Run::is_empty")]
    pub run: Run,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub icon: String,
}

impl Config {
    pub fn is_empty(&self) -> bool {
        self.name.is_empty()
            && self.description.is_empty()
            && self.run.is_empty()
            && self.icon.is_empty()
    }
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct Run {
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub before: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub after: String,
}

impl Run {
    pub fn is_empty(&self) -> bool {
        self.before.is_empty() && self.after.is_empty()
    }
}
