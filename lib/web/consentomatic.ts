export class Tools {
  static base = null;

  static setBase(base) {
    Tools.base = base;
  }

  static findElement(options, parent = null, multiple = false) {
    let possibleTargets = null;

    if (parent != null) {
      possibleTargets = Array.from(parent.querySelectorAll(options.selector));
    } else {
      if (Tools.base != null) {
        possibleTargets = Array.from(
          Tools.base.querySelectorAll(options.selector)
        );
      } else {
        possibleTargets = Array.from(
          document.querySelectorAll(options.selector)
        );
      }
    }

    if (options.textFilter != null) {
      possibleTargets = possibleTargets.filter(possibleTarget => {
        let textContent = possibleTarget.textContent.toLowerCase();

        if (Array.isArray(options.textFilter)) {
          let foundText = false;

          for (let text of options.textFilter) {
            if (textContent.indexOf(text.toLowerCase()) !== -1) {
              foundText = true;
              break;
            }
          }

          return foundText;
        } else if (options.textFilter != null) {
          return textContent.indexOf(options.textFilter.toLowerCase()) !== -1;
        }
      });
    }

    if (options.styleFilters != null) {
      possibleTargets = possibleTargets.filter(possibleTarget => {
        let styles = window.getComputedStyle(possibleTarget);

        let keep = true;

        for (let styleFilter of options.styleFilters) {
          let option = styles[styleFilter.option];

          if (styleFilter.negated) {
            keep = keep && option !== styleFilter.value;
          } else {
            keep = keep && option === styleFilter.value;
          }
        }

        return keep;
      });
    }

    if (options.displayFilter != null) {
      possibleTargets = possibleTargets.filter(possibleTarget => {
        if (options.displayFilter) {
          //We should be displayed
          return possibleTarget.offsetHeight !== 0;
        } else {
          //We should not be displayed
          return possibleTarget.offsetHeight === 0;
        }
      });
    }

    if (options.iframeFilter != null) {
      possibleTargets = possibleTargets.filter(possibleTarget => {
        if (options.iframeFilter) {
          //We should be inside an iframe
          return window.location !== window.parent.location;
        } else {
          //We should not be inside an iframe
          return window.location === window.parent.location;
        }
      });
    }

    if (options.childFilter != null) {
      possibleTargets = possibleTargets.filter(possibleTarget => {
        let oldBase = Tools.base;
        Tools.setBase(possibleTarget);
        let childResults = Tools.find(options.childFilter);
        Tools.setBase(oldBase);
        return childResults.target != null;
      });
    }

    if (multiple) {
      return possibleTargets;
    } else {
      if (possibleTargets.length > 1) {
        console.warn(
          "Multiple possible targets: ",
          possibleTargets,
          options,
          parent
        );
      }

      return possibleTargets[0];
    }
  }

  static find(options, multiple = false) {
    let results = [];
    if (options.parent != null) {
      let parent = Tools.findElement(options.parent, null, multiple);
      if (parent != null) {
        if (parent instanceof Array) {
          parent.forEach(p => {
            let targets = Tools.findElement(options.target, p, multiple);
            if (targets instanceof Array) {
              targets.forEach(target => {
                results.push({
                  parent: p,
                  target: target
                });
              });
            } else {
              results.push({
                parent: p,
                target: targets
              });
            }
          });

          return results;
        } else {
          let targets = Tools.findElement(options.target, parent, multiple);
          if (targets instanceof Array) {
            targets.forEach(target => {
              results.push({
                parent: parent,
                target: target
              });
            });
          } else {
            results.push({
              parent: parent,
              target: targets
            });
          }
        }
      }
    } else {
      let targets = Tools.findElement(options.target, null, multiple);
      if (targets instanceof Array) {
        targets.forEach(target => {
          results.push({
            parent: null,
            target: target
          });
        });
      } else {
        results.push({
          parent: null,
          target: targets
        });
      }
    }

    if (results.length === 0) {
      results.push({
        parent: null,
        target: null
      });
    }

    if (multiple) {
      return results;
    } else {
      if (results.length !== 1) {
        console.warn(
          "Multiple results found, even though multiple false",
          results
        );
      }

      return results[0];
    }
  }
}

export async function executeAction(config, param?): Promise<void> {
  switch(config.type) {
    case "click": return clickAction(config);
    case "list": return listAction(config, param);
    case "consent": return consentAction(config);
    case "ifcss": return ifCssAction(config);
    case "waitcss": return waitCssAction(config);
    case "foreach": return forEachAction(config);
    case "hide": return hideAction(config);
    case "slide": return slideAction(config);
    case "close": return closeAction(config);
    case "wait": return waitAction(config);
    default: throw "Unknown action type: "+config.type;
  }
}

const STEP_TIMEOUT = 250;

function waitTimeout(timeout: number): Promise<void> {
  return new Promise((resolve)=>{
      setTimeout(()=>{resolve();}, timeout);
  });
}

async function clickAction(config) {
  const result = Tools.find(config);
  if (result.target != null) {
    result.target.click();
  }
  return waitTimeout(STEP_TIMEOUT);
}

async function listAction(config, param) {
  for(let action of config.actions) {
    await executeAction(action, param);
  }
}

async function consentAction(config, consentTypes) {
  for (const consentConfig of config.consents) {
    const shouldEnable = consentTypes.indexOf(consentConfig.type) !== -1;
    if (consentConfig.enabledMatcher && consentConfig.toggleAction) {
      
    } else {
      if (shouldEnable) {
        await executeAction(consentConfig.trueAction);
      } else {
        await executeAction(consentConfig.falseAction);
      }
    }
  }
}