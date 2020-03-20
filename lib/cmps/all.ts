import { AutoConsent, AutoConsentConfig } from './base';
import Quantcast from './quantcast';
import TagCommander from './tagcommander';
import TrustArc from './trustarc';
import CookieBot from './cookiebot';
import AppGdpr from './appgdpr';
import AppGdpr2 from './appgdpr2';
import Future from './future';

const rules = [
  new Quantcast(),
  new TagCommander(),
  new TrustArc(),
  new CookieBot(),
  new AppGdpr(),
  new AppGdpr2(),
  new Future(),
];

export function createAutoCMP(config: AutoConsentConfig): AutoConsent {
  return new AutoConsent(config);
}

export default rules;
