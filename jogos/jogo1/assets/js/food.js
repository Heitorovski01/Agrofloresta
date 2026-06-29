export class Food {
  constructor(gridSize) {
    this.gridSize = gridSize;
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
        x: Math.floor(Math.random() * this.gridSize),
        y: Math.floor(Math.random() * this.gridSize)
      };

      isOnSnake = snakeBody.some(
        segment => segment.x === newPos.x && segment.y === newPos.y
      );
    }

    this.position = newPos;
    this.type = this.types[Math.floor(Math.random() * this.types.length)];
  }
}
