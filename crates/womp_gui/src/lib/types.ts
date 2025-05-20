export interface Profile {
  name: string;
  config: Config | undefined;
}

export interface Config {
  name: string | undefined;
  description: string | undefined;
  icon: string | undefined;
  run: Run | undefined;
}

export interface Run {
  before: string | undefined;
  after: string | undefined;
}
