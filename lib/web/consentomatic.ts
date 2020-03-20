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

export function matches(config) {
  const result = Tools.find(config);
  if (config.type === "css") {
    return !!result.target;
  } else if (config.type === "checkbox") {
    return !!result.target && result.target.checked;
  }
}

export async function executeAction(config, param?): Promise<boolean | void> {
  switch (config.type) {
    case "click":
      return clickAction(config);
    case "list":
      return listAction(config, param);
    case "consent":
      return consentAction(config, param);
    case "ifcss":
      return ifCssAction(config, param);
    case "waitcss":
      return waitCssAction(config);
    case "foreach":
      return forEachAction(config, param);
    case "hide":
      return hideAction(config);
    case "slide":
      return slideAction(config);
    case "close":
      return closeAction(config);
    case "wait":
      return waitAction(config);
    case "eval":
      return evalAction(config);
    default:
      throw "Unknown action type: " + config.type;
  }
}

const STEP_TIMEOUT = 0;

function waitTimeout(timeout: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, timeout);
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
  for (let action of config.actions) {
    await executeAction(action, param);
  }
}

async function consentAction(config, consentTypes) {
  for (const consentConfig of config.consents) {
    const shouldEnable = consentTypes.indexOf(consentConfig.type) !== -1;
    if (consentConfig.matcher && consentConfig.toggleAction) {
      const isEnabled = matches(consentConfig.matcher);
      if (isEnabled !== shouldEnable) {
        await executeAction(consentConfig.toggleAction);
      }
    } else {
      if (shouldEnable) {
        await executeAction(consentConfig.trueAction);
      } else {
        await executeAction(consentConfig.falseAction);
      }
    }
  }
}

async function ifCssAction(config, param) {
  const result = Tools.find(config);
  if (!result.target) {
    if (config.trueAction) {
      await executeAction(config.trueAction, param);
    }
  } else {
    if (config.falseAction) {
      await executeAction(config.falseAction, param);
    }
  }
}

async function waitCssAction(config) {
  await new Promise(resolve => {
    let numRetries = config.retries || 10;
    const waitTime = config.waitTime || 250;
    const checkCss = () => {
      const result = Tools.find(config);
      if (
        (config.negated && result.target) ||
        (!config.negated && !result.target)
      ) {
        if (numRetries > 0) {
          numRetries -= 1;
          setTimeout(checkCss, waitTime);
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    };
    checkCss();
  });
}

async function forEachAction(config, param) {
  const results = Tools.find(config, true);
  const oldBase = Tools.base;
  for (const result of results) {
    if (result.target) {
      Tools.setBase(result.target);
      await executeAction(config.action, param);
    }
  }
  Tools.setBase(oldBase);
}

async function hideAction(config) {
  const result = Tools.find(config);
  if (result.target) {
    result.target.classList.add("Autoconsent-Hidden");
    // result.target.setAttribute("style", "display: none;");
  }
}

async function slideAction(config) {
  const result = Tools.find(config);
  const dragResult = Tools.find(config.dragTarget);
  if (result.target) {
    let targetBounds = result.target.getBoundingClientRect();
    let dragTargetBounds = dragResult.target.getBoundingClientRect();

    let yDiff = dragTargetBounds.top - targetBounds.top;
    let xDiff = dragTargetBounds.left - targetBounds.left;

    if (this.config.axis.toLowerCase() === "y") {
      xDiff = 0;
    }
    if (this.config.axis.toLowerCase() === "x") {
      yDiff = 0;
    }

    let screenX = window.screenX + targetBounds.left + targetBounds.width / 2.0;
    let screenY = window.screenY + targetBounds.top + targetBounds.height / 2.0;
    let clientX = targetBounds.left + targetBounds.width / 2.0;
    let clientY = targetBounds.top + targetBounds.height / 2.0;

    let mouseDown = document.createEvent("MouseEvents");
    mouseDown.initMouseEvent(
      "mousedown",
      true,
      true,
      window,
      0,
      screenX,
      screenY,
      clientX,
      clientY,
      false,
      false,
      false,
      false,
      0,
      result.target
    );
    let mouseMove = document.createEvent("MouseEvents");
    mouseMove.initMouseEvent(
      "mousemove",
      true,
      true,
      window,
      0,
      screenX + xDiff,
      screenY + yDiff,
      clientX + xDiff,
      clientY + yDiff,
      false,
      false,
      false,
      false,
      0,
      result.target
    );
    let mouseUp = document.createEvent("MouseEvents");
    mouseUp.initMouseEvent(
      "mouseup",
      true,
      true,
      window,
      0,
      screenX + xDiff,
      screenY + yDiff,
      clientX + xDiff,
      clientY + yDiff,
      false,
      false,
      false,
      false,
      0,
      result.target
    );
    result.target.dispatchEvent(mouseDown);
    await this.waitTimeout(10);
    result.target.dispatchEvent(mouseMove);
    await this.waitTimeout(10);
    result.target.dispatchEvent(mouseUp);
  }
}

async function waitAction(config) {
  await waitTimeout(config.waitTime);
}

async function closeAction(config) {
  window.close();
}

async function evalAction(config) {
  console.log('eval!', config.code);
  return window.eval(config.code);
}
