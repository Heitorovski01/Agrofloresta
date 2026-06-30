export class Food {
  constructor(gridCols, gridRows) {
    this.gridCols = gridCols;
    this.gridRows = gridRows;
    this.position = { x: 0, y: 0 };
    this.types = ['buriti', 'pequi', 'jatoba'];
    this.type = this.types[0];
    this.spawn([]);
  }

  spawn(snakeBody) {
    let newPos;
    let isOnSnake = true;

    while (isOnSnake) {
      newPos = {
        x: Math.floor(Math.random() * this.gridCols),
        y: Math.floor(Math.random() * this.gridRows)
      };

      isOnSnake = snakeBody.some(
        segment => segment.x === newPos.x && segment.y === newPos.y
      );
    }

    this.position = newPos;
    this.type = this.types[Math.floor(Math.random() * this.types.length)];
  }
}
