import { AutoCMP, TabActor } from "../types";
import { createMatcher, Matcher } from "./matcher";

type DetectorConfig = {
  presentMatcher: {};
  showingMatcher: {};
};
type MethodConfig = {};

export type ConsentOMaticConfig = {
  detectors: DetectorConfig[];
  methods: MethodConfig[];
};

export class ConsentOMaticCMP implements AutoCMP {
  presentMatchers: Matcher[];
  showingMatchers: Matcher[];

  constructor(public name: string, public config: ConsentOMaticConfig) {
    this.presentMatchers = this.config.detectors.map(detectorConfig =>
      createMatcher(detectorConfig.presentMatcher)
    );
    this.showingMatchers = this.config.detectors.map(detectorConfig =>
      createMatcher(detectorConfig.showingMatcher)
    );
  }

  async detectCmp(tab: TabActor): Promise<boolean> {
    const detections = await Promise.all(
      this.presentMatchers.map(matcher => matcher.matches(tab))
    );
    return detections.some(matched => matched);
  }
  async detectPopup(tab: TabActor): Promise<boolean> {
    const detections = await Promise.all(
      this.showingMatchers.map(matcher => matcher.matches(tab))
    );
    return detections.some(matched => matched);
  }
  optOut(tab: TabActor): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  optIn(tab: TabActor): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  openCmp(tab: TabActor): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  test(tab: TabActor): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  detectFrame(tab: TabActor, frame: { url: string }): boolean {
    throw new Error("Method not implemented.");
  }
}
