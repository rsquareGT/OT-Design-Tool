export class ZoomManager {
  constructor(canvas) {
    this.canvas = canvas;
  }

  zoomIn() {
    this.canvas.setZoom(this.canvas.getZoom() * 1.1);
  }

  zoomOut() {
    this.canvas.setZoom(this.canvas.getZoom() / 1.1);
  }

  resetZoom() {
    this.canvas.setZoom(1);
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  }
}
