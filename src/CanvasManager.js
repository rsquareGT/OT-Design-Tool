import { Canvas, Line, Rect, Group, Object } from 'fabric';
//import { UndoRedoManager } from "./utils/UndoRedoManager";
import { ZoomManager } from './utils/ZoomManager';
import { StateManager } from './utils/StateManager';
import Wall from './objects/wall';

export class CanvasManager {
  constructor() {
    this.canvas = new Canvas('canvas', {
      backgroundColor: '#f0f0f0',
    });

    this.wallManager = new Wall(this.canvas);

    this.gridSize = 20; // Size of the grid squares
    this.grid = null;

    this.tempWall = null; // Temporary wall for preview
    this.wallStart = null; // Start point of the wall
    this.drawingMode = false; // Toggle for drawing mode

    //this.undoRedoManager = new UndoRedoManager(this.canvas);
    this.zoomManager = new ZoomManager(this.canvas);

    this.isDragging = false;
    this.lastPosX = 0;
    this.lastPosY = 0;

    this.initializeDrag();
    //this.initializeUndoRedo();
    this.initializeZoom();
    //this.createGrid();

    this.state = new StateManager(this.canvas);
  }

  createGrid() {
    if (this.grid) {
      this.canvas.remove(this.grid);
    }

    this.grid = new Group([], { selectable: false, saveable: false });

    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    // Vertical lines
    for (let x = 0; x < canvasWidth; x += this.gridSize) {
      this.grid.add(
        new Line([x, 0, x, canvasHeight], {
          stroke: '#ddd',
          strokeWidth: 1,
          selectable: false,
          saveable: false,
        })
      );
    }

    // Horizontal lines
    for (let y = 0; y < canvasHeight; y += this.gridSize) {
      this.grid.add(
        new Line([0, y, canvasWidth, y], {
          stroke: '#ddd',
          strokeWidth: 1,
          selectable: false,
          saveable: false,
        })
      );
    }

    this.canvas.add(this.grid);
    this.canvas.insertAt(0, this.grid);
  }

  deleteSelectedObjects() {
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      //this.undoRedoManager.saveState(); // Save state before deleting
      this.canvas.discardActiveObject();
      this.canvas.remove(...activeObjects);
    }
  }

  // initializeUndoRedo() {
  //     this.canvas.on({
  //         "object:added": () => {
  //             //this.undoRedoManager.saveState();
  //             console.log("object:added called");
  //         },
  //         "object:modified": () => {
  //             //this.undoRedoManager.saveState();
  //             console.log("object:modified called");
  //         },
  //         "object:removed": () => {
  //             //this.undoRedoManager.saveState(); // Save state when objects are removed
  //             console.log("object:removed called");
  //         },
  //     });
  // }

  initializeDrag() {
    this.canvas.on({
      'mouse:down': (opt) => {
        const evt = opt.e;
        if (evt.altKey === true) {
          this.isDragging = true;
          //this.canvas.selection = false;
          this.lastPosX = evt.clientX;
          this.lastPosY = evt.clientY;
        }

        if (this.wallManager.drawingWall) {
          this.wallManager.startDrawingWall(opt.e);
        }
      },
      'mouse:move': (opt) => {
        if (this.isDragging) {
          const e = opt.e;
          const vpt = this.canvas.viewportTransform;
          vpt[4] += e.clientX - this.lastPosX;
          vpt[5] += e.clientY - this.lastPosY;
          this.canvas.requestRenderAll();
          this.lastPosX = e.clientX;
          this.lastPosY = e.clientY;
        }

        if (this.wallManager.drawingWall) {
          this.wallManager.drawTempWall(opt.e); // Call drawTempWall while dragging
        }
      },
      'mouse:up': (opt) => {
        this.isDragging = false;

        if (this.wallManager.drawingWall) {
          this.wallManager.finalizeWall(opt.e);
        }
      },
      'mouse:dblclick': () => {
        this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        this.canvas.setZoom(1);
      },
      'object:modified': (opt) => {
        if (opt.target && opt.target instanceof Line) {
          this.wallManager.updatePanel();
        }
      },
      'selection:created': this.updateSelection.bind(this),
      'selection:updated': this.updateSelection.bind(this),
      'selection:cleared': () => {
        this.hidePropertiesPanel();
      },
    });
  }

  updateSelection() {
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length === 1 && activeObjects[0] instanceof Line) {
      this.wallManager.selectedWall = activeObjects[0];
      this.wallManager.updatePanel();
    } else {
      this.hidePropertiesPanel();
    }
  }

  hidePropertiesPanel() {
    const panel = document.getElementById('propertiesPanel');
    if (panel) {
      panel.classList.add('d-none');
    }
  }

  initializeZoom() {
    this.canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = this.canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 10) zoom = 10;
      if (zoom < 0.1) zoom = 0.1;
      this.canvas.setZoom(zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  }

  // Expose undo/redo/zoom methods for use elsewhere
  undo() {
    this.state.undo();
  }

  redo() {
    this.state.redo();
  }

  zoomIn() {
    this.zoomManager.zoomIn();
  }

  zoomOut() {
    this.zoomManager.zoomOut();
  }

  resetZoom() {
    this.zoomManager.resetZoom();
  }

  resizeCanvas() {
    const canvasContainer = document.getElementById('canvas-container');

    // Ensure the canvas container exists
    if (!canvasContainer) {
      console.error('Canvas container element not found.');
      return;
    }

    // Get the new dimensions
    const newWidth = canvasContainer.clientWidth;
    const newHeight = canvasContainer.clientHeight;

    // Set the new dimensions for the canvas
    this.canvas.setDimensions({ width: newWidth, height: newHeight });

    // Clear existing grid lines and redraw them
    //this.createGrid();

    this.canvas.requestRenderAll();
  }

  disableSelection() {
    this.canvas.selection = false;
    this.canvas.forEachObject((obj) => {
      if (obj.selectable) {
        obj.selectable = false;
      }
    });
  }

  enableSelection() {
    this.canvas.selection = true;
    this.canvas.forEachObject((obj) => {
      if (!obj.selectable) {
        obj.selectable = true;
      }
    });
  }
}
