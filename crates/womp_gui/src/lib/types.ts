export interface Profile {
  name: string;
  config: Config | null;
}

export interface Config {
  name: string;
  description: string;
  icon: string;
  run: Run;
}

export interface Run {
  before: string;
  after: string;
}

