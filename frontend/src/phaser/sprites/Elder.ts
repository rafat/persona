
import { NPC } from './NPC';

export class Elder extends NPC {
  constructor(scene: Phaser.Scene, x: number, y: number, relationship: number) {
    super(scene, x, y, 'elder', relationship);
  }
}
