
import * as Phaser from 'phaser';
import { NPC } from './NPC';

export class Villager extends NPC {
  private moveTimer: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, relationship: number) {
    super(scene, x, y, 'villager', relationship);

    this.moveTimer = scene.time.addEvent({
      delay: 2000,
      callback: () => {
        const newVelocityX = Phaser.Math.Between(-50, 50);
        const newVelocityY = Phaser.Math.Between(-50, 50);
        this.setVelocity(newVelocityX, newVelocityY);
      },
      loop: true,
    });
  }

  destroy(fromScene?: boolean) {
    this.moveTimer.destroy();
    super.destroy(fromScene);
  }
}
