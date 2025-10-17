
import { NPC } from './NPC';

export class Guard extends NPC {
  private patrolSpeed = 100;
  private patrolDistance = 200;
  private startX: number;

  constructor(scene: Phaser.Scene, x: number, y: number, relationship: number) {
    super(scene, x, y, 'guard', relationship);
    this.startX = x;
    this.setVelocityX(this.patrolSpeed);
  }

  update() {
    super.update();

    if (this.x > this.startX + this.patrolDistance) {
      this.setVelocityX(-this.patrolSpeed);
    } else if (this.x < this.startX) {
      this.setVelocityX(this.patrolSpeed);
    }
  }
}
