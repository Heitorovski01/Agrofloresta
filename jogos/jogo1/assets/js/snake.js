export class Snake {
  constructor(initialX = 10, initialY = 10) {
    this.body = [{ x: initialX, y: initialY }];
    this.direction = { x: 0, y: 0 };
    this.nextDirection = { x: 0, y: 0 }; // prevent multiple turns in one tick
  }

  changeDirection(newDir) {
    // Prevent reversing direction
    if (this.direction.x !== 0 && this.direction.x === -newDir.x) return;
    if (this.direction.y !== 0 && this.direction.y === -newDir.y) return;
    
    this.nextDirection = { ...newDir };
  }

  update() {
    this.direction = { ...this.nextDirection };
    
    // Calculate new head position
    const head = this.body[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };

    // If moving, add new head and remove tail (unless growing, which is Phase 2)
    if (this.direction.x !== 0 || this.direction.y !== 0) {
      this.body.unshift(newHead);
      this.body.pop();
    }
  }
}
