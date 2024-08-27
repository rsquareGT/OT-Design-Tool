import { Object } from 'fabric';
import cloneDeep from 'lodash/cloneDeep';

export class StateManager {
  objectMap = new Map();
  mapIndex = 0;
  history = [];
  historyIndex = -1;
  canvas = null;
  saveState = true;
  keysToSave = [
    'angle',
    'left',
    'top',
    'scaleX',
    'scaleY',
    'skewX',
    'skewY',
    'fill',
  ];

  constructor(canvas) {
    this.canvas = canvas;
    this._setup_events();
  }

  _setup_events() {
    /*
     * Listens to add, remove and modified events on the canvas and stores them in the history
     */
    this.canvas.on('object:added', (e) => {
      /*
       * When an object is added, there is no need for properties to be stored in the history
       * We can just state that the object is added and pass an id.
       * The id is the index of the object in the map
       */
      let uniqueId = this._addToMap(e.target);
      if (!e.target.saveable || !this.saveState) return;
      this._addState(uniqueId, 'add', null, null);
    });

    this.canvas.on('object:removed', (e) => {
      /*
       * When an object is removed, there is no need for properties to be stored in the history
       * We can just state that the object is removed and pass an id.
       * The id is the index of the object in the map
       */
      if (!e.target.saveable || !this.saveState) return;
      let uniqueId = e.target.uniqueId;
      this._addState(uniqueId, 'remove', null, null);
    });

    this.canvas.on('object:modified', (e) => {
      /*
       * When an object is modified, we need to store the previous properties of the object in history
       * This is because the current properties are already stored in the object
       * So when we undo or redo we need to know what the previous properties were
       * We can just state that the object is modified and pass an id and the previous properties
       */
      if (!e.target.saveable || !this.saveState) return;
      // Check if the object is in the map
      if (!e.target.uniqueId) {
        // Since the object isn't in the map, we can assume the group is a selected group by the user
        // Selection groups are temporary, so we need to handle this slightly different
        this._onSelectionGroupModified(e);
        return;
      }

      let uniqueId = this._addToMap(e.target);
      // Get the after properties from the beforeProperties keys and 'target'
      let beforeProperties = {};
      let afterProperties = {};
      this.keysToSave.forEach((key) => {
        afterProperties[key] = e.target[key];
        beforeProperties[key] = e.transform.original[key];
        if (beforeProperties[key] === undefined)
          beforeProperties[key] = e.target[key];
      });

      this._addState(uniqueId, 'modify', beforeProperties, afterProperties);
    });

    this.canvas.on('before:transform', (e) => {
      var target = e.transform.target;
      if (target.type === 'activeSelection') {
        target._beforeProperties = [];
        console.log('Handle Transform');
        target._objects.forEach((object) => {
          // Get the object's position relative to the group's center
          var objectLeft = object.left;
          var objectTop = object.top;

          // Calculate the group's center position
          var groupCenterX = target.left;
          var groupCenterY = target.top;

          // Compute the distance from the object to the group's center
          var distanceX = objectLeft * target.scaleX;
          var distanceY = objectTop * target.scaleY;

          // Use the group's angle to rotate the object's position around the group's center
          var radianAngle = fabric.util.degreesToRadians(target.angle);
          var rotatedX =
            distanceX * Math.cos(radianAngle) -
            distanceY * Math.sin(radianAngle);
          var rotatedY =
            distanceX * Math.sin(radianAngle) +
            distanceY * Math.cos(radianAngle);

          // Translate the object's position to canvas space
          var canvasLeft = groupCenterX + rotatedX;
          var canvasTop = groupCenterY + rotatedY;

          // Store the before properties in canvas space
          target._beforeProperties.push({
            uniqueId: object.uniqueId,
            left: canvasLeft,
            top: canvasTop,
            scaleX: object.scaleX * target.scaleX,
            scaleY: object.scaleY * target.scaleY,
            angle: object.angle + target.angle,
          });
        });
      }
    });
  }

  _onSelectionGroupModified(e) {
    /*
     * Selection Groups are temporary groups created by the user interaction with the canvas
     * Fabricjs performs the following actions:
     * 1. Remove objects from the canvas
     * 2. Create a temporary group of the objects
     * 3. Add the temporary group to the canvas
     * 4. User can modify this group as much as they want while selected
     * 5. When the user deselects the group, the group is removed from the canvas
     * 6. The objects are added back to the canvas
     *
     * To perform undo / redo, we track the before and after states of the objects, NOT the group
     *
     * When the group is formed, the objects values are updated relative to the group instead of the canvas.
     * This means that even the objects in the map have group relative values. Not useful for us.
     * In the 'before:transform' event, we reverse the group relative values to canvas relative values and
     * store the result in the group's _beforeProperties array.
     * I'd like to personally thank ChatGPT for helping a lot in that...
     */
    var beforeObjects = e.target._beforeProperties;
    // We need to restore the objects to the canvas before we can get the after properties
    // But what if the user still has the group selected? If we restore the objects,
    // the group will restore again when the user deselects the group
    // resulting in the objects group -> canvas space being recaculated incorrectly.
    // So we need to make a copy of the group and restore the copy
    var groupCopy = cloneDeep(e.target);
    groupCopy._restoreObjectsState();
    var afterObjects = groupCopy._objects;

    // Checks that the before and after objects are the same length
    if (beforeObjects.length != afterObjects.length) {
      console.log('Error: Before and After objects are not the same length');
      return;
    }

    // Loop through the objects and store
    for (var i = 0; i < beforeObjects.length; i++) {
      var beforeObject = beforeObjects[i];
      var afterObject = afterObjects[i];
      var uniqueId = this._addToMap(afterObject);
      var beforeProperties = {};
      var afterProperties = {};
      console.log('Before Object: ', beforeObject);
      console.log('After Object: ', afterObject);
      // We only want to store the keys that we care about
      this.keysToSave.forEach((key) => {
        beforeProperties[key] = beforeObject[key];
        afterProperties[key] = afterObject[key];
        if (beforeProperties[key] === undefined)
          beforeProperties[key] = afterObject[key];
      });
      if (!i) {
        this._addState(uniqueId, 'modify', beforeProperties, afterProperties);
      } else {
        this._extendState(
          uniqueId,
          'modify',
          beforeProperties,
          afterProperties
        );
      }
    }
  }

  _addToMap(object) {
    /*
     * Adds an object to the map and returns the index
     */
    if (object.uniqueId) return object.uniqueId;
    this.mapIndex += 1;
    object.uniqueId = this.mapIndex;
    this.objectMap.set(this.mapIndex, object);
    return this.mapIndex;
  }

  _formatState(uniqueId, action, beforeProperties, afterProperties) {
    /*
     * Formats the state to be added to the history
     */
    var formattedState = {
      uniqueId: uniqueId,
      action: action,
      before: cloneDeep(beforeProperties),
      after: cloneDeep(afterProperties),
    };
    return formattedState;
  }

  _addState(uniqueId, action, beforeProperties, afterProperties) {
    /*
     * Adds the fabricjs object properties to the history
     */
    this.historyIndex += 1;
    // Remove all states after the current history index
    this.history = this.history.slice(0, this.historyIndex);
    this.formattedState = this._formatState(
      uniqueId,
      action,
      beforeProperties,
      afterProperties
    );
    this.history[this.historyIndex] = [this.formattedState];
  }

  _extendState(uniqueId, action, beforeProperties, afterProperties) {
    /*
     * Extends the last state in the history
     */
    this.formattedState = this._formatState(
      uniqueId,
      action,
      beforeProperties,
      afterProperties
    );
    this.history[this.historyIndex].push(this.formattedState);
  }

  _modify(object, state, reverse) {
    /*
     * Modifies the object based on the state
     * If reverse is true, it will modify the object based on the 'before' properties
     * If reverse is false, it will modify the object based on the 'after' properties
     */
    console.log(state);
    let properties = reverse ? state.before : state.after;
    object.set(properties);
    object.setCoords();
    this.canvas.fire('object:rotating', { target: object });
    this.canvas.renderAll();
  }

  undo() {
    if (this.historyIndex < 0) return;
    this.saveState = false;
    this.canvas.discardActiveObject();

    try {
      // Loop through all the states at this index
      for (var i = 0; i < this.history[this.historyIndex].length; i++) {
        var state = this.history[this.historyIndex][i];
        var object = this.objectMap.get(state.uniqueId);
        switch (state.action) {
          case 'add':
            this.canvas.remove(object);
            break;
          case 'remove':
            this.canvas.add(object);
            break;
          case 'modify':
            this._modify(object, state, true);
            break;
        }
      }

      this.historyIndex -= 1;
    } catch (e) {
      console.log('Issue with Undo');
      console.log(e);
    } finally {
      this.saveState = true;
      this.canvas.requestRenderAll();
    }
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return;
    this.saveState = false;
    this.canvas.discardActiveObject();

    try {
      this.historyIndex += 1;
      // Loop through all the states at this index
      for (var i = 0; i < this.history[this.historyIndex].length; i++) {
        var state = this.history[this.historyIndex][i];
        var object = this.objectMap.get(state.uniqueId);

        switch (state.action) {
          case 'add':
            this.canvas.add(object);
            break;
          case 'remove':
            this.canvas.remove(object);
            break;
          case 'modify':
            this._modify(object, state, false);
            break;
        }
      }
    } catch (e) {
      console.log('Issue with Redo');
      console.log(e);
    } finally {
      this.saveState = true;
      this.canvas.requestRenderAll();
    }
  }
}

/*
 * OPTIONAL: setState function for objects. Assign it as a default function for objects
 * fabric.Object.prototype.set({
 *    setState: setState
 * });
 */

Object.prototype.set({
  setState: setState,
  originX: 'center',
  originY: 'center', // Has to be center. See warning above
});

function setState(properties) {
  /*
   * 'set' for a fabricjs object doesn't fire 'object:modified'
   * So if we want to hook onto our state class we'll need to set a custom
   * 'setState' function. We could just override 'set' but sometimes you may
   * want to perform actions that don't get recorded in the state history
   */
  let keysToSave = [
    'angle',
    'left',
    'top',
    'scaleX',
    'scaleY',
    'skewX',
    'skewY',
    'fill',
  ];
  var targetCopy = this.toObject();

  // Apply the properties using the 'set' method
  this.set(properties);

  // Determine if changes were made
  var changes = {};
  keysToSave.forEach((key) => {
    changes[key] = targetCopy[key];
  });

  // If changes were detected, fire the 'object:modified' event
  if (Object.keys(changes).length > 0) {
    // Construct the transform object including the 'original' attribute
    var transform = {
      target: this,
      original: changes,
    };

    this.fire('object:modified', { target: this, transform: transform });

    // If the object is on the canvas, notify the canvas of the object's modification
    if (this.canvas) {
      this.canvas.fire('object:modified', {
        target: this,
        transform: transform,
      });
      this.canvas.requestRenderAll();
    }
  }

  return changes;
}
