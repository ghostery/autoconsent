import { AutoCMP, TabActor } from "../types";

type Method = 'HIDE_CMP' | 'OPEN_OPTIONS' | 'HIDE_CMP' | 'DO_CONSENT' | 'SAVE_CONSENT' | 'TEST_CONSENT';
type DetectorConfig = {
  presentMatcher: {};
  showingMatcher: {};
};
type MethodConfig = {
  action: {
    type: string
  },
  name: Method
};

export type ConsentOMaticConfig = {
  detectors: DetectorConfig[];
  methods: MethodConfig[];
};

export class ConsentOMaticCMP implements AutoCMP {

  methods = new Map<Method, {}>()
  hasSelfTest: boolean

  constructor(public name: string, public config: ConsentOMaticConfig) {
    config.methods.forEach((methodConfig) => {
      if (methodConfig.action) {
        this.methods.set(methodConfig.name, methodConfig.action);
      }
    });
    this.hasSelfTest = this.methods.has('TEST_CONSENT');
  }

  async detectCmp(tab: TabActor): Promise<boolean> {
    return (await Promise.all(
      this.config.detectors.map(detectorConfig => tab.matches(detectorConfig.presentMatcher))
    )).some(matched => matched);
  }

  async detectPopup(tab: TabActor): Promise<boolean> {
    return (await Promise.all(
      this.config.detectors.map(detectorConfig => tab.matches(detectorConfig.showingMatcher))
    )).some(matched => matched);
  }

  async executeAction(tab: TabActor, method: Method, param?) {
    if (this.methods.has(method)) {
      return tab.executeAction(this.methods.get(method), param);
    }
    return true;
  }

  async optOut(tab: TabActor): Promise<boolean> {
    console.log('xxx opt out');
    await this.executeAction(tab, 'HIDE_CMP');
    await this.executeAction(tab, 'OPEN_OPTIONS');
    await this.executeAction(tab, 'HIDE_CMP');
    await this.executeAction(tab, 'DO_CONSENT', []);
    await this.executeAction(tab, 'SAVE_CONSENT');
    return true;
  }
  optIn(tab: TabActor): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  openCmp(tab: TabActor): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  test(tab: TabActor): Promise<boolean> {
    return this.executeAction(tab, 'TEST_CONSENT')
  }
  detectFrame(tab: TabActor, frame: { url: string }): boolean {
    throw new Error("Method not implemented.");
  }
}
