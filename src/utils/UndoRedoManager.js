export class UndoRedoManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.history = [];
    this.redoStack = [];
    this.saveState();
  }

  saveState() {
    const state = this.canvas.toObject();
    this.history.push(state);
    this.redoStack = []; // Clear redo stack on new action
  }

  undo() {
    if (this.history.length > 1) {
      const state = this.history.pop();
      this.redoStack.push(this.canvas.toObject());
      this.canvas.loadFromJSON(this.history[this.history.length - 1]);
      this.canvas.renderAll();
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const state = this.redoStack.pop();
      this.history.push(this.canvas.toObject());
      this.canvas.loadFromJSON(state);
      this.canvas.renderAll();
    }
  }
}
