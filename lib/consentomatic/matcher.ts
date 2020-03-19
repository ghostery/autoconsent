import { TabActor } from "../types";

export interface Matcher {
  matches(tab: TabActor): Promise<boolean>;
}

export function createMatcher(config): Matcher {
  switch (config.type) {
    case "css":
      return new CssMatcher(config);
    case "checkbox":
      return new CheckboxMatcher(config);
    default:
      throw "Unknown matcher type: " + config.type;
  }
}

class CssMatcher implements Matcher {
  constructor(public config) {}

  async matches(tab: TabActor) {
    const result = await tab.find(this.config);
    return !!result.target;
  }
}

class CheckboxMatcher implements Matcher {
  constructor(public config) {}

  async matches(tab: TabActor) {
    const result = await tab.find(this.config);
    return !!result.target && result.target.checked;
  }
}
