import { Line, Point } from 'fabric';

export default class Wall {
  constructor(canvas) {
    this.canvas = canvas;
    this.tempWall = null; // Temporary wall for preview
    this.wallStart = null; // Start point of the wall
    this.drawingWall = false; // Toggle for drawing mode
    this.selectedWall = null; // Currently selected wall

    // Conversion factor: 1 inch = 2.54 cm; 1 inch = 96 px (default web DPI)
    this.pxToCm = 96 / 2.54; // Conversion factor from pixels to centimeters
  }

  addWall(x1, y1, x2, y2) {
    const wall = new Line([x1, y1, x2, y2], {
      stroke: 'black',
      strokeWidth: 5,
      saveable: true,
      originX: 'left',
      originY: 'bottom',
      selectable: false,
    });
    this.canvas.add(wall);

    wall.on('selected', () => {
      this.selectedWall = wall;
      this.updatePanel();
    });

    wall.on('modified', (e) => {
      //console.log("wall rotated", e);

      if (e.action === 'rotate' || e.action === 'scale') {
        this.selectedWall = wall;
        this.updatePanel();
      }
    });
  }

  startDrawingWall(evt) {
    this.wallStart = this.canvas.getPointer(evt);
    //console.log(this.wallStart);
  }

  drawTempWall(opt) {
    if (this.wallStart) {
      const pointer = this.canvas.getPointer(opt);
      const x1 = this.wallStart.x;
      const y1 = this.wallStart.y;
      const x2 = pointer.x;
      const y2 = pointer.y;

      // Remove the temporary wall if it exists
      if (this.tempWall) {
        this.canvas.remove(this.tempWall);
      }

      this.tempWall = new Line([x1, y1, x2, y2], {
        stroke: 'grey',
        strokeWidth: 3,
        selectable: false,
        evented: false,
        saveable: false,
      });

      this.canvas.add(this.tempWall);
      this.canvas.requestRenderAll();
    }
  }

  finalizeWall(opt) {
    if (this.wallStart) {
      const pointer = this.canvas.getPointer(opt);
      const x1 = this.wallStart.x;
      const y1 = this.wallStart.y;
      const x2 = pointer.x;
      const y2 = pointer.y;

      this.addWall(x1, y1, x2, y2);

      // Remove the temporary wall
      if (this.tempWall) {
        this.canvas.remove(this.tempWall);
        this.tempWall = null;
      }

      this.wallStart = null;
    }
  }

  stopDrawingWall() {
    if (this.tempWall) {
      this.canvas.remove(this.tempWall);
      this.tempWall = null;
    }

    this.wallStart = null;
  }

  updatePanel1() {
    if (this.selectedWall) {
      const x1 = this.selectedWall.get('x1');
      const y1 = this.selectedWall.get('y1');
      const x2 = this.selectedWall.get('x2');
      const y2 = this.selectedWall.get('y2');
      const lengthPx = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      const lengthCm = (lengthPx / this.pxToCm).toFixed(2);
      const angle = this.calculateAngle(x1, y1, x2, y2);

      const event = new CustomEvent('wall:dimensions', {
        detail: {
          lengthCm: lengthCm,
          angle: angle,
        },
      });
      window.dispatchEvent(event);
    }
  }

  updatePanel() {
    if (this.selectedWall) {
      const wall = this.selectedWall;
      const canvas = this.canvas;

      // Get transformed coordinates using fabric methods
      const { x1, y1, x2, y2 } = wall;

      // Calculate actual positions after transformation
      const points = [
        new Point(x1, y1).transform(wall.calcTransformMatrix()),
        new Point(x2, y2).transform(wall.calcTransformMatrix()),
      ];

      // Recalculate length using transformed coordinates
      const lengthPx = Math.sqrt(
        Math.pow(points[1].x - points[0].x, 2) +
          Math.pow(points[1].y - points[0].y, 2)
      );

      const lengthCm = (lengthPx / this.pxToCm).toFixed(2); // Convert to centimeters

      // Calculate angle relative to x-axis
      const angle = this.calculateAngle(
        points[0].x,
        points[0].y,
        points[1].x,
        points[1].y
      );
      console.log({ lengthCm, angle });
      // Notify the panel with the new dimensions and angle
      const event = new CustomEvent('wall:dimensions', {
        detail: {
          lengthCm: lengthCm,
          angle: angle,
        },
      });
      window.dispatchEvent(event);
    }
  }

  calculateAngle(x1, y1, x2, y2) {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const angleRad = Math.atan2(deltaY, deltaX);
    const angleDeg = angleRad * (180 / Math.PI);

    return angleDeg >= 0 ? angleDeg : 360 + angleDeg; // Ensure angle is positive
  }

  updateWallLength(lengthCm) {
    if (this.selectedWall) {
      const lengthPx = lengthCm * this.pxToCm;
      const x1 = this.selectedWall.get('x1');
      const y1 = this.selectedWall.get('y1');
      const x2 = this.selectedWall.get('x2');
      const y2 = this.selectedWall.get('y2');
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const x2New = x1 + lengthPx * Math.cos(angle);
      const y2New = y1 + lengthPx * Math.sin(angle);

      this.selectedWall.set({ x2: x2New, y2: y2New });
      this.canvas.requestRenderAll();
    }
  }

  updateWallRotation(angle) {
    if (this.selectedWall) {
      const x1 = this.selectedWall.get('x1');
      const y1 = this.selectedWall.get('y1');
      const x2 = this.selectedWall.get('x2');
      const y2 = this.selectedWall.get('y2');

      const currentAngle = this.calculateAngle(x1, y1, x2, y2);
      const rotationAngle = angle - currentAngle;
      this.selectedWall.rotate(rotationAngle);
      this.canvas.requestRenderAll();
    }
  }
}
