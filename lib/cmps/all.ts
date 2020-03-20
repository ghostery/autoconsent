import { AutoConsent, AutoConsentConfig } from './base';
import TagCommander from './tagcommander';
import TrustArc from './trustarc';
import CookieBot from './cookiebot';
import AppGdpr from './appgdpr';
import Future from './future';

const rules = [
  new TagCommander(),
  new TrustArc(),
  new CookieBot(),
  new AppGdpr(),
  new Future(),
];

export function createAutoCMP(config: AutoConsentConfig): AutoConsent {
  return new AutoConsent(config);
}

export default rules;
