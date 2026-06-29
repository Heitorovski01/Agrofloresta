export class Snake {
  constructor(initialX = 10, initialY = 10) {
    this.body = [{ x: initialX, y: initialY }];
    this.direction = { x: 0, y: 0 };
    this.nextDirection = { x: 0, y: 0 }; // prevent multiple turns in one tick
    this.growing = false;
  }

  changeDirection(newDir) {
    // Prevent reversing direction
    if (this.direction.x !== 0 && this.direction.x === -newDir.x) return;
    if (this.direction.y !== 0 && this.direction.y === -newDir.y) return;
    
    this.nextDirection = { ...newDir };
  }

  grow() {
    this.growing = true;
  }

  update() {
    this.direction = { ...this.nextDirection };
    
    // Calculate new head position
    const head = this.body[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
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
