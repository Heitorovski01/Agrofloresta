export class Snake {
  constructor(initialX = 10, initialY = 10) {
    this.body = [{ x: initialX, y: initialY }];
    this.direction = { x: 0, y: 0 };
    this.nextDirection = { x: 0, y: 0 }; // prevent multiple turns in one tick
    this.inputQueue = [];
    this.growing = false;
  }

  changeDirection(newDir) {
    // If stationary (not started moving yet), overwrite the queue
    if (this.direction.x === 0 && this.direction.y === 0) {
      this.inputQueue = [{ ...newDir }];
      this.nextDirection = { ...newDir };
      return;
    }

    const lastDir =
      this.inputQueue.length > 0
        ? this.inputQueue[this.inputQueue.length - 1]
        : this.direction;

    // Prevent reversing direction (180 degree turn)
    if (lastDir.x !== 0 && lastDir.x === -newDir.x) return;
    if (lastDir.y !== 0 && lastDir.y === -newDir.y) return;

    // Prevent pushing the same direction consecutively
    if (lastDir.x === newDir.x && lastDir.y === newDir.y) return;

    if (this.inputQueue.length < 2) {
      this.inputQueue.push({ ...newDir });
      this.nextDirection = { ...newDir }; // keep nextDirection in sync for compat and unit tests
    }
  }

  grow() {
    this.growing = true;
  }

  update() {
    if (this.inputQueue.length > 0) {
      this.direction = this.inputQueue.shift();
    }

    // Calculate new head position
    const head = this.body[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y,
    };

    // If moving, add new head and remove tail (unless growing)
    if (this.direction.x !== 0 || this.direction.y !== 0) {
      this.body.unshift(newHead);

      if (this.growing) {
        this.growing = false; // reset growing state
      } else {
        this.body.pop(); // remove tail if not growing
      }
    }
  }
}
