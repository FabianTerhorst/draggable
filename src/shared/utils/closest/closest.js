/*
function matchFunction({defaultView: view}) {
  return (
    view.Element.prototype.matches ||
    view.Element.prototype.webkitMatchesSelector ||
    view.Element.prototype.mozMatchesSelector ||
    view.Element.prototype.msMatchesSelector
  );
}
*/

/*
const matchFunction =
  Element.prototype.matches ||
  Element.prototype.webkitMatchesSelector ||
  Element.prototype.mozMatchesSelector ||
  Element.prototype.msMatchesSelector;
  */
/**
 * Get the closest parent element of a given element that matches the given
 * selector string or matching function
 *
 * @param {Element} element The child element to find a parent of
 * @param {String|Function} value The string or function to use to match
 *     the parent element
 * @param {Document[]} currHosts The host
 * @return {Element|null}
 */
export default function closest(element, value, currHosts = undefined) {
  if (!element) {
    return null;
  }
  let hosts = currHosts;
  if (!hosts) {
    hosts = [element.ownerDocument];
  }
  for (const host of hosts) {
    const closestElement = closestSingle(element, value, host);
    if (closestElement != null) {
      return closestElement;
    }
  }
  return null;
}

function closestSingle(element, value, host) {
  const selector = value;
  const callback = value;
  const nodeList = value;
  const singleElement = value;

  const isSelector = Boolean(typeof value === 'string');
  const isFunction = Boolean(typeof value === 'function');
  const isNodeList = Boolean(value instanceof NodeList || value instanceof Array);
  const isElement = Boolean(value instanceof HTMLElement);

  function conditionFn(currentElement) {
    try {
      if (!currentElement) {
        return currentElement;
      } else if (isSelector) {
        return currentElement.matches(selector); // matchFunction.call(currentElement, selector); /* (host) */
      } else if (isNodeList) {
        return [...nodeList].includes(currentElement);
      } else if (isElement) {
        return singleElement === currentElement;
      } else if (isFunction) {
        return callback(currentElement);
      } else {
        return null;
      }
    } catch (_) {
      return null;
    }
  }

  let current = element;

  do {
    current = current.correspondingUseElement || current.correspondingElement || current;

    if (conditionFn(current)) {
      return current;
    }

    current = current.parentNode;
  } while (current && current !== (host.host || host.body) && current !== host);

  return null;
}
