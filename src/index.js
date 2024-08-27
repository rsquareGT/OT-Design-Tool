import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import { CanvasManager } from './CanvasManager';
import Wall from './objects/wall';

var canvasManager = new CanvasManager();

document.getElementById('undoBtn').addEventListener('click', () => {
  canvasManager.undo();
});

document.getElementById('redoBtn').addEventListener('click', () => {
  canvasManager.redo();
});

document.getElementById('zoomInBtn').addEventListener('click', () => {
  canvasManager.zoomIn();
});

document.getElementById('zoomOutBtn').addEventListener('click', () => {
  canvasManager.zoomOut();
});

document.getElementById('resetZoomBtn').addEventListener('click', () => {
  canvasManager.resetZoom();
});

// Initial canvas size setup
canvasManager.resizeCanvas();

// Add resize event listener
window.addEventListener('resize', () => {
  canvasManager.resizeCanvas();
});

const drawWallButton = document.getElementById('draWallBtn');
let drawingMode = false;
drawWallButton.addEventListener('click', (event) => {
  debugger;
  drawingMode = !drawingMode;
  drawWallButton.textContent = drawingMode ? 'Cancel Drawing' : 'Draw Wall';
  if (drawingMode) {
    canvasManager.disableSelection();
  } else {
    canvasManager.enableSelection();
  }

  canvasManager.wallManager.drawingWall = drawingMode;
});

document.getElementById('deleteBtn').addEventListener('click', () => {
  canvasManager.deleteSelectedObjects();
});

// Handle wall dimensions panel updates
window.addEventListener('wall:dimensions', (e) => {
  const panel = document.getElementById('propertiesPanel');
  const lengthInput = document.getElementById('length-input');
  const rotationInput = document.getElementById('rotation-input');

  if (e.detail.lengthCm && panel) {
    lengthInput.value = e.detail.lengthCm;
    rotationInput.value = e.detail.angle ?? 0;
    panel.classList.remove('d-none');
  }
});

// Update wall length based on input from properties panel
document.getElementById('length-input').addEventListener('input', (e) => {
  const lengthCm = parseFloat(e.target.value);
  if (!isNaN(lengthCm)) {
    canvasManager.wallManager.updateWallLength(lengthCm);
  }
});

// Update wall rotation based on input from properties panel
document.getElementById('rotation-input').addEventListener('input', (e) => {
  const rotationDeg = parseFloat(e.target.value);
  if (!isNaN(rotationDeg)) {
    canvasManager.wallManager.updateWallRotation(rotationDeg);
  }
});

// Hide properties panel when no wall is selected
canvasManager.canvas.on('selection:cleared', () => {
  const panel = document.getElementById('propertiesPanel');
  if (panel) {
    panel.classList.add('d-none');
  }
});
