# Floor Plan Designer

A JavaScript library for creating interactive 2D floor plans. This library allows users to design floor plans by adding and manipulating walls, doors, windows, and other elements.

## Features

- Add and manipulate walls, doors, and windows.
- Draw walls by clicking, dragging, and releasing on the canvas.
- Seamlessly connect walls at angles.
- Undo and redo actions.
- Zoom in and out of the canvas.
- Display dimensions and rotation of walls in a properties panel.

## Getting Started

To get started with the Floor Plan Designer library, follow these instructions.

### Prerequisites

- Node.js and npm (or Yarn) installed on your system.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/rsquareGT/OT-Design-Tool.git
   ```

2. Navigate to the project directory:

   ```bash
   cd floor-plan-designer
   ```

3. Install the dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

4. Build the project:

   ```bash
   npm run build
   # or
   yarn build
   ```

5. Start the development server:

   ```bash
   npm start
   # or
   yarn start
   ```

6. Open your browser and go to `http://localhost:8080` to view the application.

## Usage

### Drawing Walls

1. Click on the "Draw Wall" button in the sidebar.
2. Click and drag on the canvas to draw a wall.
3. Release the mouse button to finalize the wall.

### Selecting and Editing Walls

1. Click on a wall to select it.
2. The properties panel will display the dimensions and rotation of the selected wall.
3. You can adjust the length and rotation of the wall using the inputs in the properties panel.

### Undo and Redo

- Use the "Undo" and "Redo" buttons to revert or reapply changes.

### Zoom

- Use the "Zoom In" and "Zoom Out" buttons to adjust the zoom level.
- Click "Reset Zoom" to return to the default zoom level.

### Deleting Walls

- Select a wall and click the "Delete Selected" button to remove it.

## Contributing

Contributions are welcome! Please submit issues and pull requests to the repository.

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes and commit (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Fabric.js for the canvas manipulation.
- [Your Other Acknowledgements]

---

For any issues or questions, please contact [Your Contact Information].
