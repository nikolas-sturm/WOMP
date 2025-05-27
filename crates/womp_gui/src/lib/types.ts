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
  before: RunCommand | undefined;
  after: RunCommand | undefined;
}

export interface RunCommand {
  target: string | undefined;
  args: string | undefined;
}