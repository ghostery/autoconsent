import Tools from './consentomatic';

export default function handleMessage(message: any, debug = false) {
  if (message.type === 'click') {
    const elem = document.querySelectorAll(message.selector);
    debug && console.log('[click]', message.selector, elem);
    if (elem.length > 0) {
      if (message.all === true) {
        elem.forEach(e => e.click());
      } else {
        elem[0].click();
      }
    }
    return Promise.resolve(elem.length > 0);
  } else if (message.type === 'elemExists') {
    const exists = document.querySelector(message.selector) !== null;
    debug && console.log('[exists?]', message.selector, exists);
    return Promise.resolve(exists);
  } else if (message.type === 'elemVisible') {
    const elem = document.querySelectorAll(message.selector);
    const results = new Array(elem.length);
    elem.forEach((e, i) => {
      results[i] = e.offsetParent !== null;
    });
    if (results.length === 0) {
      return Promise.resolve(false);
    } else if (message.check === 'any') {
      return Promise.resolve(results.some(r => r));
    } else if (message.check === 'none') {
      return Promise.resolve(results.every(r => !r));
    }
    // all
    return Promise.resolve(results.every(r => r));
  } else if (message.type === 'getAttribute') {
    const elem = document.querySelector(message.selector);
    if (!elem) {
      return Promise.resolve(false);
    }
    return Promise.resolve(elem.getAttribute(message.attribute));
  } else if (message.type === 'eval') {
    // TODO: chrome support
    try {
      const result = window.eval(message.script); // eslint-disable-line no-eval
      debug && console.log('[eval]', message.script, result);
      return Promise.resolve(result);
    } catch (e) {
      return Promise.reject(e);
    }
  } else if (message.type === 'hide') {
    const parent = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
    const hidden = message.selectors.filter((selector) => {
      const matching = document.querySelectorAll(selector);
      return matching.length > 0;
    }, []);
    const rule = `${hidden.join(',')} { display: none !important; }`;
    const css = document.createElement('style');
    css.type = 'text/css';
    css.id = 're-consent-css-rules';
    css.appendChild(document.createTextNode(rule));
    parent.appendChild(css);
    return Promise.resolve(hidden);
  } else if (message.type === 'find') {
    const result = Tools.find(message.options, message.multiple);

    function createSerialisableResult(result) {
      return {
        parent: !!result.parent,
        target: !!result.target && {
          checked: result.target.checked,
        }
      }
    }
    if (message.multiple) {
      return Promise.resolve(result.map(createSerialisableResult))
    }
    return Promise.resolve(createSerialisableResult(result));
  }
  return Promise.resolve(null);
}
