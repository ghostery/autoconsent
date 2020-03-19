import { AutoConsent } from './base';
import Quantcast from './quantcast';
import Optanon from './optanon';
import TheGuardian from './theguardian';
import TagCommander from './tagcommander';
import TrustArc from './trustarc';
import CookieBot from './cookiebot';
import AppGdpr from './appgdpr';
import AppGdpr2 from './appgdpr2';
import Future from './future';
import genericRules from './rules';

const rules = [
  new Quantcast(),
  new Optanon(),
  new TheGuardian(),
  new TagCommander(),
  new TrustArc(),
  new CookieBot(),
  new AppGdpr(),
  new AppGdpr2(),
  new Future(),
];
genericRules.forEach((rule) => {
  rules.push(new AutoConsent(rule));
});
// const rules = [];

export default rules;
