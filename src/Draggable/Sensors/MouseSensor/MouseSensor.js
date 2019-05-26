import {closest} from 'shared/utils';
import Sensor from '../Sensor';
import {DragStartSensorEvent, DragMoveSensorEvent, DragStopSensorEvent} from '../SensorEvent';

const onContextMenuWhileDragging = Symbol('onContextMenuWhileDragging');
const onMouseDown = Symbol('onMouseDown');
const onMouseMove = Symbol('onMouseMove');
const onMouseUp = Symbol('onMouseUp');

/**
 * This sensor picks up native browser mouse events and dictates drag operations
 * @class MouseSensor
 * @module MouseSensor
 * @extends Sensor
 */
export default class MouseSensor extends Sensor {
  /**
   * MouseSensor constructor.
   * @constructs MouseSensor
   * @param {HTMLElement[]|NodeList|HTMLElement} containers - Containers
   * @param {Object} options - Options
   * @param {DocumentOrShadowRoot} hosts - Hosts
   */
  constructor(containers = [], options = {}, hosts = []) {
    super(containers, options, hosts);

    /**
     * Indicates if mouse button is still down
     * @property mouseDown
     * @type {Boolean}
     */
    this.mouseDown = false;

    /**
     * Mouse down timer which will end up triggering the drag start operation
     * @property mouseDownTimeout
     * @type {Number}
     */
    this.mouseDownTimeout = null;

    /**
     * Indicates if context menu has been opened during drag operation
     * @property openedContextMenu
     * @type {Boolean}
     */
    this.openedContextMenu = false;

    this[onContextMenuWhileDragging] = this[onContextMenuWhileDragging].bind(this);
    this[onMouseDown] = this[onMouseDown].bind(this);
    this[onMouseMove] = this[onMouseMove].bind(this);
    this[onMouseUp] = this[onMouseUp].bind(this);
  }

  /**
   * Attaches sensors event listeners to the DOM
   */
  attach() {
    this.addHostsEventListener('mousedown', this[onMouseDown], true);
  }

  /**
   * Detaches sensors event listeners to the DOM
   */
  detach() {
    this.addHostsEventListener('mousedown', this[onMouseDown], true);
  }

  /**
   * Mouse down handler
   * @private
   * @param {Event} event - Mouse down event
   */
  [onMouseDown](event) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey) {
      return;
    }

    this.addHostsEventListener('mouseup', this[onMouseUp]);
    // currentHost.addEventListener('dragstart', preventNativeDragStart);

    let target = null;
    let container = null;
    for (const host of this.hosts) {
      target = host.elementFromPoint(event.clientX, event.clientY);
      if (target) {
        container = closest(target, this.containers, [host]);
        if (container) {
          host.addEventListener('dragstart', preventNativeDragStart);
          break;
        } else {
          target = null;
        }
      }
    }

    if (!target || !container) {
      return;
    }

    this.addHostsEventListener('dragstart', preventNativeDragStart);

    this.mouseDown = true;

    clearTimeout(this.mouseDownTimeout);
    this.mouseDownTimeout = setTimeout(() => {
      if (!this.mouseDown) {
        return;
      }

      const dragStartEvent = new DragStartSensorEvent({
        clientX: event.clientX,
        clientY: event.clientY,
        target,
        container,
        originalEvent: event,
      });

      this.trigger(container, dragStartEvent);

      this.currentContainer = container;
      this.dragging = !dragStartEvent.canceled();

      if (this.dragging) {
        this.addHostsEventListener('contextmenu', this[onContextMenuWhileDragging]);
        this.addHostsEventListener('mousemove', this[onMouseMove]);
      }
    }, this.options.delay);
  }

  /**
   * Mouse move handler
   * @private
   * @param {Event} event - Mouse move event
   */
  [onMouseMove](event) {
    if (!this.dragging) {
      return;
    }

    let currTarget = null;
    for (const host of this.hosts) {
      const target = host.elementFromPoint(event.clientX, event.clientY);
      if (target) {
        let invalidFound = false;
        for (const currHost of this.hosts) {
          if (currHost.host === target) {
            invalidFound = true;
          }
        }
        if (!invalidFound) {
          currTarget = target;
        }
      }
    }

    if (!currTarget) {
      return;
    }

    const dragMoveEvent = new DragMoveSensorEvent({
      clientX: event.clientX,
      clientY: event.clientY,
      currTarget,
      container: this.currentContainer,
      originalEvent: event,
    });

    this.trigger(this.currentContainer, dragMoveEvent);
  }

  /**
   * Mouse up handler
   * @private
   * @param {Event} event - Mouse up event
   */
  [onMouseUp](event) {
    this.mouseDown = Boolean(this.openedContextMenu);

    if (this.openedContextMenu) {
      this.openedContextMenu = false;
      return;
    }

    this.removeHostsEventListener('mouseup', this[onMouseUp]);
    this.removeHostsEventListener('dragstart', preventNativeDragStart);

    if (!this.dragging) {
      return;
    }

    let target = null;
    for (const host of this.hosts) {
      target = host.elementFromPoint(event.clientX, event.clientY);
      if (target) {
        break;
      }
    }

    const dragStopEvent = new DragStopSensorEvent({
      clientX: event.clientX,
      clientY: event.clientY,
      target,
      container: this.currentContainer,
      originalEvent: event,
    });

    this.trigger(this.currentContainer, dragStopEvent);

    this.removeHostsEventListener('contextmenu', this[onContextMenuWhileDragging]);
    this.removeHostsEventListener('mousemove', this[onMouseMove]);

    this.currentContainer = null;
    this.dragging = false;
  }

  /**
   * Context menu handler
   * @private
   * @param {Event} event - Context menu event
   */
  [onContextMenuWhileDragging](event) {
    event.preventDefault();
    this.openedContextMenu = true;
  }
}

function preventNativeDragStart(event) {
  event.preventDefault();
}
